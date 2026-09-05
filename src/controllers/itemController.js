import { db, bucket } from "../config/firebase.js";
import crypto from "crypto";

const itemsCollection = db.collection("items");


// CREATE ITEM
export const createItem = async (req, res) => {
  try {
    const {
      name,
      price,
      categoryId,
      available = "true",
    } = req.body;

    // Validation
    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, price and categoryId are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    // Check category
    const categoryRef = db
      .collection("categories")
      .doc(categoryId);

    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      return res.status(400).json({
        success: false,
        message: "Category does not exist",
      });
    }

    // Image required
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    // Create unique file name
    const fileName = `products/${Date.now()}-${crypto.randomUUID()}-${req.file.originalname}`;

    const file = bucket.file(fileName);

    // Upload image
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Generate signed URL
    const [imageUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2035",
    });

    const itemData = {
      name: name.trim(),
      price: Number(price),
      categoryId,
      imageUrl,
      imagePath: fileName,
      available: available === true || available === "true",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const itemRef = await itemsCollection.add(itemData);

    const newItem = await itemRef.get();

    res.status(201).json({
      success: true,
      message: "Item created successfully",

      item: {
        id: newItem.id,
        ...newItem.data(),
      },
    });

  } catch (error) {
    console.error("Create item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create item",
      error: error.message,
    });
  }
};


// GET ALL ITEMS
export const getItems = async (req, res) => {
  try {
    const snapshot = await itemsCollection
      .orderBy("createdAt", "desc")
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      items,
    });

  } catch (error) {
    console.error("Get items error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get items",
    });
  }
};


// GET SINGLE ITEM
export const getItem = async (req, res) => {
  try {
    const { id } = req.params;

    const itemRef = itemsCollection.doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      item: {
        id: itemSnap.id,
        ...itemSnap.data(),
      },
    });

  } catch (error) {
    console.error("Get item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get item",
    });
  }
};


// UPDATE ITEM
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      price,
      categoryId,
      available,
    } = req.body;

    const itemRef = itemsCollection.doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    if (categoryId !== undefined) {
      const categorySnap = await db
        .collection("categories")
        .doc(categoryId)
        .get();

      if (!categorySnap.exists) {
        return res.status(400).json({
          success: false,
          message: "Category does not exist",
        });
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (price !== undefined) {
      updateData.price = Number(price);
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    if (available !== undefined) {
      updateData.available =
        available === true || available === "true";
    }

    // New image
    if (req.file) {
      // Delete old image first
      const oldItemData = itemSnap.data();

      if (oldItemData.imagePath) {
        try {
          await bucket
            .file(oldItemData.imagePath)
            .delete();
        } catch (error) {
          // Don't fail the whole update if old image
          // has already been deleted
          console.log(
            "Old image could not be deleted:",
            error.message
          );
        }
      }

      // Create new file name
      const fileName =
        `products/${Date.now()}-${crypto.randomUUID()}-${req.file.originalname}`;

      const file = bucket.file(fileName);

      // Upload new image
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Generate new signed URL
      const [imageUrl] = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2035",
      });

      updateData.imageUrl = imageUrl;
      updateData.imagePath = fileName;
    }

    await itemRef.update(updateData);

    const updatedSnap = await itemRef.get();

    res.json({
      success: true,
      message: "Item updated successfully",

      item: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    });

    } catch (error) {
    console.error("Update item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
};


// DELETE ITEM
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const itemRef = itemsCollection.doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const itemData = itemSnap.data();

    // Delete image from Firebase Storage
    if (itemData.imagePath) {
      try {
        await bucket
          .file(itemData.imagePath)
          .delete();

        console.log(
          "Product image deleted:",
          itemData.imagePath
        );
      } catch (error) {
        console.log(
          "Image deletion failed:",
          error.message
        );
      }
    }

    // Delete Firestore document
    await itemRef.delete();

    res.json({
      success: true,
      message: "Item deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete item error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
};