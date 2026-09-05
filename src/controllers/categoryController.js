import { db } from "../config/firebase.js";

const categoriesCollection = db.collection("categories");

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();

    // Check duplicate category
    const existing = await categoriesCollection
      .where("name", "==", categoryName)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const categoryRef = await categoriesCollection.add({
      name: categoryName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const categorySnap = await categoryRef.get();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: {
        id: categorySnap.id,
        ...categorySnap.data(),
      },
    });
  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};


// GET ALL CATEGORIES
export const getCategories = async (req, res) => {
  try {
    const snapshot = await categoriesCollection
      .orderBy("name", "asc")
      .get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};


// GET SINGLE CATEGORY
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryRef = categoriesCollection.doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      category: {
        id: categorySnap.id,
        ...categorySnap.data(),
      },
    });
  } catch (error) {
    console.error("Get category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get category",
    });
  }
};


// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryRef = categoriesCollection.doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await categoryRef.update({
      name: name.trim(),
      updatedAt: new Date(),
    });

    const updatedSnap = await categoryRef.get();

    res.json({
      success: true,
      message: "Category updated successfully",
      category: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    });
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};


// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryRef = categoriesCollection.doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await categoryRef.delete();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};