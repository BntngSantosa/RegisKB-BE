const express = require("express");
const supabase = require("../config/supabase");
const client = require("../config/twilio");

const router = express.Router();

const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber.startsWith("0")) {
    return "+62" + phoneNumber.slice(1);
  }
  return phoneNumber;
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  // Adjust age if the birth date hasn't occurred yet this year
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
};

router.post("/create", async (req, res) => {
  const {
    nik,
    nama,
    wa,
    tanggal_lahir,
    jenis_kelamin,
    kota,
    kecamatan,
    kelurahan,
    rt,
    rw,
    alat_kontrasepsi,
    tanggal_daftar,
  } = req.body;

  const formattedWa = formatPhoneNumber(wa);

  try {
    if (
      !nik ||
      !nama ||
      !wa ||
      !tanggal_lahir ||
      !jenis_kelamin ||
      !kota ||
      !kecamatan ||
      !kelurahan ||
      !rt ||
      !rw ||
      !alat_kontrasepsi ||
      !tanggal_daftar
    ) {
      return res.status(400).json({ message: "Semua data wajib diisi." });
    }

    if (isNaN(new Date(tanggal_daftar).getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid." });
    }

    const usia = calculateAge(tanggal_lahir);

    // Logika siklus berdasarkan alat kontrasepsi
    let durasi;
    if (alat_kontrasepsi === "Pil") durasi = 30;
    else if (alat_kontrasepsi === "Suntik 1 bulan") durasi = 30;
    else if (alat_kontrasepsi === "Suntik 3 bulan") durasi = 90;

    // Hitung tanggal pengingat berikutnya
    const tanggalAwal = new Date(tanggal_daftar);
    const tanggalBerikutnya = new Date(tanggalAwal);
    tanggalBerikutnya.setDate(tanggalAwal.getDate() + durasi);

    const formattedTanggalBerikutnya = tanggalBerikutnya
      .toISOString()
      .split("T")[0];



    // Kirim pesan pertama kali
    const pesanAwal = await client.messages.create({
      from: "whatsapp:+14155238886", // Nomor WhatsApp Twilio Sandbox
      to: `whatsapp:${formattedWa}`,
      body: `Halo! ${nama} Anda telah berhasil mendaftar untuk KB dengan metode ${alat_kontrasepsi}. Tanggal pendaftaran: ${tanggalAwal.toDateString()}. Jadwal berikutnya: ${tanggalBerikutnya.toDateString()}.`,
    });

    console.log(`Pesan pertama berhasil dikirim dengan SID: ${pesanAwal.sid}`);

    // Simpan data pengingat di Supabase
    const { error } = await supabase.from("kb_registration").insert([
      {
        nik,
        nama,
        wa: formattedWa,
        tanggal_lahir,
        usia: usia,
        jenis_kelamin,
        kota,
        kecamatan,
        kelurahan,
        rt,
        rw,
        alat_kontrasepsi,
        tanggal_daftar,
        tanggal_berikutnya: formattedTanggalBerikutnya,
      },
    ]);

    if (error) throw error;

    if (error) throw error;

    // Kirim pesan pengingat pertama
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Nomor WhatsApp Twilio Sandbox
      to: `whatsapp:${formattedWa}`,
      body: `Halo! ${nama} Ini pengingat KB Anda untuk metode ${alat_kontrasepsi}. Jadwal berikutnya: ${formattedTanggalBerikutnya}.`,
    });

    res.status(201).json({
      message: "Pendaftaran berhasil, dan pengingat telah dibuat.",
      firstMessageId: pesanAwal.sid,
      reminderMessageId: message.sid,
    });
  } catch (err) {
    res.status(500).json({ message: `Terjadi kesalahan: ${err.message}` });
  }
});

module.exports = router;
