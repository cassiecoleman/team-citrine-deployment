import {
  mockFareEstimate,
  mockContacts,
  mockFareSplit,
  mockDriver,
  mockReceipt,
} from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import type { FareEstimate, Contact, FareSplit, Driver, RideReceipt } from "./types";

export async function getFareEstimate(): Promise<FareEstimate> {
  await mockDelay();
  return mockFareEstimate;
}

export async function getContacts(): Promise<Contact[]> {
  await mockDelay();
  return mockContacts;
}

export async function sendInvite(contactId: string): Promise<FareSplit> {
  await mockDelay(500, 1000);
  return mockFareSplit;
}

export async function getMatchedDriver(): Promise<Driver> {
  await mockDelay(800, 1500);
  return mockDriver;
}

export async function getRideReceipt(): Promise<RideReceipt> {
  await mockDelay();
  return mockReceipt;
}
