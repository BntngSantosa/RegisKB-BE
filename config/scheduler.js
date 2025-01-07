const cron = require("node-cron");
const supabase = require("./supabase");
const client = require("./twilio");

// Jalankan cron job setiap hari pukul 9 pagi
cron.schedule("0 9 * * *", async () => {
  try {
    const today = new Date();
    const hMinus1 = new Date(today);
    hMinus1.setDate(today.getDate() + 1);
    const formattedHMinus1 = hMinus1.toISOString().split("T")[0];

    // Ambil data pengguna yang jadwal berikutnya adalah besok
    const { data: registrations, error } = await supabase
      .from("kb_registration")
      .select("*")
      .eq("tanggal_berikutnya", formattedHMinus1);

    if (error) throw error;

    // Kirim pengingat dan perbarui tanggal berikutnya
    for (const registration of registrations) {
      const {
        id,
        nama,
        alat_kontrasepsi,
        wa,
        tanggal_berikutnya: currentDate,
      } = registration;

      // Kirim pesan pengingat ke pengguna
      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:${wa}`,
        body: `Halo! ${nama}, ini pengingat KB Anda untuk metode ${alat_kontrasepsi}. Jadwal berikutnya: ${currentDate}.`,
      });

      console.log(`Pengingat H-1 dikirim ke ${nama} (${wa}).`);

      // Hitung tanggal berikutnya berdasarkan durasi jenis KB
      let durasi = 30; // Default durasi untuk "Pil" atau "Suntik 1 bulan"
      if (alat_kontrasepsi === "Suntik 3 bulan") durasi = 90;

      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + durasi);
      const formattedNextDate = nextDate.toISOString().split("T")[0];

      // Perbarui tanggal_berikutnya di database
      const { error: updateError } = await supabase
        .from("kb_registration")
        .update({ tanggal_berikutnya: formattedNextDate })
        .eq("id", id);

      if (updateError) throw updateError;

      console.log(
        `Tanggal berikutnya diperbarui untuk ${nama} (${wa}) menjadi ${formattedNextDate}.`
      );
    }
  } catch (err) {
    console.error(
      `Error saat mengirim pengingat atau memperbarui tanggal: ${err.message}`
    );
  }
});
