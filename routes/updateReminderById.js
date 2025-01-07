const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// Endpoint untuk memperbarui data pengingat berdasarkan NIK
router.put("/reminder/:nik", async (req, res, next) => {
  const { nik } = req.params;
  const {
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
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("kb_registration")
      .update({
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
      })
      .eq("nik", nik)
      .select();

    if (error) throw error;

    if (!data.length) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
