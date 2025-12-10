import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';

export interface Profile {
    id: number;
    uuid: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
    if (db) return db;

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'drizzle_explorer.db');

    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Create profiles table
    db.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `);

    // Create an initial profile if none exists
    const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
    if (profileCount.count === 0) {
        const now = new Date().toISOString();
        const uuid = randomUUID();
        db.prepare(`
            INSERT INTO profiles (uuid, name, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)
        `).run(uuid, 'Default Profile', now, now);
    }

    return db;
}

export function getDatabase(): Database.Database {
    if (!db) {
        return initDatabase();
    }
    return db;
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

// Profile operations
export function getProfile(): Profile | undefined {
    const db = getDatabase();
    return db.prepare('SELECT * FROM profiles LIMIT 1').get() as Profile | undefined;
}

export function updateProfile(name: string): Profile {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const profile = getProfile();
    if (profile) {
        db.prepare('UPDATE profiles SET name = ?, updatedAt = ? WHERE id = ?')
            .run(name, now, profile.id);
        return db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile.id) as Profile;
    }
    
    // If no profile exists, create one
    const uuid = randomUUID();
    const result = db.prepare(`
        INSERT INTO profiles (uuid, name, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
    `).run(uuid, name, now, now);
    
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(result.lastInsertRowid) as Profile;
}

export function regenerateUUID(): Profile {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newUuid = randomUUID();
    
    const profile = getProfile();
    if (profile) {
        db.prepare('UPDATE profiles SET uuid = ?, updatedAt = ? WHERE id = ?')
            .run(newUuid, now, profile.id);
        return db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile.id) as Profile;
    }
    
    throw new Error('No profile found');
}
