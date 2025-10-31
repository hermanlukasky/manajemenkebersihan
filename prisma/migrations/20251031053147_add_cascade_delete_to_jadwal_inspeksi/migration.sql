-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspeksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laporanId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "komentar" TEXT,
    "inspectorId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeksi_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Pegawai" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inspeksi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inspeksi" ("createdAt", "id", "inspectorId", "isVerified", "komentar", "laporanId", "rating", "updatedAt") SELECT "createdAt", "id", "inspectorId", "isVerified", "komentar", "laporanId", "rating", "updatedAt" FROM "Inspeksi";
DROP TABLE "Inspeksi";
ALTER TABLE "new_Inspeksi" RENAME TO "Inspeksi";
CREATE TABLE "new_Jadwal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaTugas" TEXT NOT NULL,
    "ruanganId" TEXT NOT NULL,
    "hariTanggal" DATETIME NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "kantorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Jadwal_kantorId_fkey" FOREIGN KEY ("kantorId") REFERENCES "Kantor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "Ruangan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Jadwal" ("createdAt", "hariTanggal", "id", "jamMulai", "jamSelesai", "kantorId", "namaTugas", "pegawaiId", "ruanganId", "status", "updatedAt") SELECT "createdAt", "hariTanggal", "id", "jamMulai", "jamSelesai", "kantorId", "namaTugas", "pegawaiId", "ruanganId", "status", "updatedAt" FROM "Jadwal";
DROP TABLE "Jadwal";
ALTER TABLE "new_Jadwal" RENAME TO "Jadwal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
