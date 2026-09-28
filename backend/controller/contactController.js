const { Contact } = require("../models");

// ─── POST /api/contact — create a new contact message ───
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, and message are required" });
    }

    const contact = await Contact.create({
      name,
      email,
      phone: phone || "",
      subject: subject || "",
      message,
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received.",
      data: contact,
    });
  } catch (err) {
    console.error("createContact error:", err);
    if (err.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: err.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ─── GET /api/contact — list all (admin only) ───
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: { is_delete: false },
      order: [["createdAt", "DESC"]],
    });
    res.json(contacts);
  } catch (err) {
    console.error("getAllContacts error:", err);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};

// ─── DELETE /api/contact/:id — soft delete (admin only) ───
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ where: { id: req.params.id } });
    if (!contact) return res.status(404).json({ message: "Not found" });

    contact.is_delete = true;
    await contact.save();

    res.json({ message: "Deleted", contact });
  } catch (err) {
    console.error("deleteContact error:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
exports.createProduct = async (req, res) => {
  try {
    // 🔑 include imageUrl in the destructure
    const { name, price, description, category, stock, imageUrl } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    console.log("=== createProduct ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("imageUrl from body:", imageUrl);

    // 🔑 Determine the image value
    let imageValue = "";
    if (req.file) {
      imageValue = "/uploads/" + req.file.filename; 
    } else if (imageUrl) {
      imageValue = imageUrl;                          
    }

    console.log("Final image value:", imageValue);

    const product = await AddProduct.create({
      name: name,
      price: Number(price),
      description: description || "",
      category: category || "Namkeen",
      image: imageValue,                              
      stock: Number(stock) || 0,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};