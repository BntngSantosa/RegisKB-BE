const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// Endpoint untuk mengambil data pengingat berdasarkan NIK
router.get("/reminder/:nik", async (req, res, next) => {
  const { nik } = req.params;

  try {
    const { data, error } = await supabase
      .from("kb_registration")
      .select(
        "*"
      )
      .eq("nik", nik)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil ditemukan.",
      data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
