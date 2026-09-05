import { db } from "../config/firebase.js";

const salesCollection = db.collection("sales");

// CREATE SALE
export const createSale = async (req, res) => {
  try {
    const { items } = req.body;

    // Validate cart
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let total = 0;
    const saleItems = [];

    // Validate items
    for (const item of items) {
      if (
        !item.id ||
        !item.name ||
        item.price === undefined ||
        !item.quantity
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid item data",
        });
      }

      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (quantity <= 0 || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity or price",
        });
      }

      const itemTotal = price * quantity;

      total += itemTotal;

      saleItems.push({
        itemId: item.id,
        name: item.name,
        price,
        quantity,
        total: itemTotal,
      });
    }

    // References
    const counterRef = db
      .collection("settings")
      .doc("billing");

    const saleRef = salesCollection.doc();

    let billNumber;

    // Firestore transaction
    await db.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);

      let lastBillNumber = 0;

      if (counterSnap.exists) {
        lastBillNumber =
          Number(counterSnap.data().lastBillNumber) || 0;
      }

      // Next number
      const nextBillNumber = lastBillNumber + 1;

      // Format:
      // 1     -> BILL-000001
      // 25    -> BILL-000025
      // 125   -> BILL-000125
      // 1000  -> BILL-001000
      billNumber = `BILL-${String(nextBillNumber).padStart(6, "0")}`;

      // Update counter
      transaction.set(
        counterRef,
        {
          lastBillNumber: nextBillNumber,
        },
        { merge: true }
      );

      // Sale data
      const saleData = {
        billNumber,

        items: saleItems,

        total,

        itemCount: saleItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),

        createdBy: {
          uid: req.user.uid,
          email: req.user.email || null,
        },

        createdAt: new Date(),
      };

      // Create sale
      transaction.set(saleRef, saleData);
    });

    // Get created sale
    const saleSnap = await saleRef.get();

    res.status(201).json({
      success: true,
      message: "Sale created successfully",

      sale: {
        id: saleSnap.id,
        ...saleSnap.data(),
      },
    });

  } catch (error) {
    console.error("Create sale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create sale",
      error: error.message,
    });
  }
};


// GET ALL SALES
export const getSales = async (req, res) => {
  try {
    const snapshot = await salesCollection
      .orderBy("createdAt", "desc")
      .get();

    const sales = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      sales,
    });

  } catch (error) {
    console.error("Get sales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get sales",
      error: error.message,
    });
  }
};


// GET SINGLE SALE
export const getSale = async (req, res) => {
  try {
    const { id } = req.params;

    const saleRef = salesCollection.doc(id);
    const saleSnap = await saleRef.get();

    if (!saleSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      sale: {
        id: saleSnap.id,
        ...saleSnap.data(),
      },
    });

  } catch (error) {
    console.error("Get sale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get sale",
      error: error.message,
    });
  }
};