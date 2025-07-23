const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const multer = require("multer");
const mime = require("mime-types");

const { createClient } = require("@supabase/supabase-js");

// Middleware & view setup
app.use(express.static(path.join(__dirname, "public"))); // ini untuk file statis tetap
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const supabase = createClient(
  "https://ayektlopemptvvajbtqv.supabase.co", // ← ganti ini
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZWt0bG9wZW1wdHZ2YWpidHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzE1NjksImV4cCI6MjA2ODgwNzU2OX0.DVvFUuUZhDAav6EVMZ4m8A3PTpg4CwMNI7iQzwAhLEo" // ← ganti ini
);

const upload = multer({ dest: "/tmp" }); // simpan sementara ke /tmp

app.post("/tambah", upload.single("foto"), async (req, res) => {
  const { nama, harga, deskripsi } = req.body;
  const file = req.file;

  let fotoUrl = null;

  if (file) {
    const ext = path.extname(file.originalname);
    const newFilename = `${Date.now()}-${file.originalname}`;
    const filePath = file.path;
    const mimeType = mime.lookup(file.path);

    const { data, error: uploadError } = await supabase.storage
      .from("sekuntum-asa") // ← nama bucket
      .upload(`katalog/${newFilename}`, fs.readFileSync(filePath), {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload gagal:", uploadError);
      return res.status(500).send("Gagal upload gambar.");
    }

    // Dapatkan URL publik
    const { data: publicUrlData } = supabase.storage.from("sekuntum-asa").getPublicUrl(`katalog/${newFilename}`);

    fotoUrl = publicUrlData.publicUrl;
  }

  // Simpan data ke database
  const { error: insertError } = await supabase.from("sekuntum-asa").insert([{ nama, harga, deskripsi, foto: fotoUrl }]);

  if (insertError) {
    console.error("Insert gagal:", insertError);
    return res.status(500).send("Gagal simpan data produk.");
  }

  res.render("tambah", { successMessage: "Produk berhasil disimpan!" });
});

// Route: Form tambah
app.get("/tambah", (req, res) => {
  res.render("tambah");
});

// Route: Tampilkan katalog
app.get("/katalog", async (req, res) => {
  try {
    const { data: produk, error } = await supabase.from("sekuntum-asa").select("*").order("nama", { ascending: true }); // Opsional: urutkan berdasarkan nama

    if (error) {
      console.error("Gagal mengambil data dari Supabase:", error);
      return res.status(500).send("Gagal memuat data katalog.");
    }

    res.render("katalog", { produk });
  } catch (err) {
    console.error("Error tak terduga:", err);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

// Route: Serve gambar dari /tmp folder
app.get("/gambar/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Gambar tidak ditemukan.");
  }
});

app.get("/", (req, res) => {
  const folderPath = path.join(__dirname, "/public/images/beranda");

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Gagal membaca folder:", err);
      return res.status(500).send("Terjadi kesalahan.");
    }

    const gambar = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

    res.render("beranda", { gambar });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
