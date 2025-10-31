-- CreateTable
CREATE TABLE "Kantor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "lokasiMap" TEXT,
    "trackingGeo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaLengkap" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "nomorTelp" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tanggalMasuk" DATETIME NOT NULL,
    "suratKontrak" TEXT,
    "kantorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pegawai_kantorId_fkey" FOREIGN KEY ("kantorId") REFERENCES "Kantor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ruangan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "tipeArea" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tingkatLantai" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "customChecklist" TEXT,
    "kantorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ruangan_kantorId_fkey" FOREIGN KEY ("kantorId") REFERENCES "Kantor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jadwal" (
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
    CONSTRAINT "Jadwal_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "Ruangan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_kantorId_fkey" FOREIGN KEY ("kantorId") REFERENCES "Kantor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Laporan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jadwalId" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    "fotoMasalah" TEXT,
    "komentar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalPoint" INTEGER NOT NULL DEFAULT 0,
    "persentase" REAL NOT NULL DEFAULT 0,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Laporan_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspeksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laporanId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "komentar" TEXT,
    "inspectorId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspeksi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspeksi_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Pegawai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laporanId" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "point" INTEGER NOT NULL,
    "maxPoint" INTEGER NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluasi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_username_key" ON "Pegawai"("username");
