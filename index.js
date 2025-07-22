const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const multer = require("multer");

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images/katalog");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });

app.get("/tambah", (req, res) => {
  res.render("tambah");
});

app.post("/tambah", upload.single("foto"), (req, res) => {
  const { nama, harga, deskripsi } = req.body;
  const foto = req.file ? `/images/katalog/${req.file.filename}` : null;

  const produkBaru = { nama, harga, deskripsi, foto };

  const dataPath = path.join(__dirname, "data", "produk.json");
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : [];

  data.push(produkBaru);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  res.render("tambah", { successMessage: "Produk berhasil disimpan!" });
});

app.get("/", (req, res) => {
  const folderPath = path.join(__dirname, "public/images/beranda");

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Gagal membaca folder:", err);
      return res.status(500).send("Terjadi kesalahan.");
    }

    const gambar = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

    res.render("beranda", { gambar });
  });
});

app.get("/katalog", (req, res) => {
  const dataPath = path.join(__dirname, "data", "produk.json");
  const produk = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : [];

  res.render("katalog", { produk });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
