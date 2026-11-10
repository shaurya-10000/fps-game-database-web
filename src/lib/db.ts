import { MongoClient } from "mongodb";

declare global {
   
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (same Atlas cluster as the backend).",
    );
  }
  return uri;
}

function getClientPromise(): Promise<MongoClient> {
  if (global.__mongoClientPromise) return global.__mongoClientPromise;
  const p = new MongoClient(getUri()).connect();
  global.__mongoClientPromise = p;
  return p;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db("fps-game-database");
}