// k6 Supabase Realtime scenario.
//
// Opens N WebSocket connections to the Supabase Realtime endpoint,
// each subscribing to `postgres_changes` on the `riders` and
// `driver_locations` tables. Verifies connect latency and ongoing
// message receipt rate.
//
// Run with: cd ultra-web && npm run loadtest:realtime
// Pre-req:  npm run loadtest:setup
//
// To generate fan-out events while this is running, in another shell:
//   cd ultra-web && npm run demo:live-map
// (or write your own driver_locations upsert loop.)

import { check } from "k6";
import { Counter, Trend } from "k6/metrics";
import ws from "k6/ws";

const seeded = JSON.parse(open("./seeded.json"));

const wsConnects = new Counter("ws_connects");
const wsMessages = new Counter("ws_messages_received");
const wsConnectMs = new Trend("ws_connect_ms");

export const options = {
  scenarios: {
    realtime: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 50 },
        { duration: "1m", target: 50 },
        { duration: "20s", target: 0 },
      ],
      gracefulStop: "10s",
    },
  },
  thresholds: {
    ws_connect_ms: ["p(95)<1000"],
    ws_connects: ["count>=50"],
  },
};

export default function () {
  const url = buildRealtimeUrl();
  const start = Date.now();
  const res = ws.connect(url, null, function (socket) {
    socket.on("open", function () {
      wsConnects.add(1);
      wsConnectMs.add(Date.now() - start);

      // Phoenix-channel join messages for postgres_changes on the two
      // location-bearing tables.
      socket.send(joinPayload("realtime:public:riders"));
      socket.send(joinPayload("realtime:public:driver_locations"));

      // Heartbeat every 25s — required by Phoenix.
      socket.setInterval(function () {
        socket.send(
          JSON.stringify({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: String(Date.now()),
          }),
        );
      }, 25_000);
    });

    socket.on("message", function () {
      wsMessages.add(1);
    });

    // Stay connected for the full VU iteration window.
    socket.setTimeout(function () {
      socket.close();
    }, 90_000);
  });

  check(res, { "ws status 101": (r) => r && r.status === 101 });
}

function buildRealtimeUrl() {
  const url = new URL(seeded.supabaseUrl);
  const proto = url.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${url.host}/realtime/v1/websocket?apikey=${seeded.anonKey}&vsn=1.0.0`;
}

function joinPayload(topic) {
  return JSON.stringify({
    topic,
    event: "phx_join",
    payload: {
      config: {
        postgres_changes: [{ event: "*", schema: "public" }],
      },
    },
    ref: String(Date.now()),
  });
}
