import { db } from "../config/firebase.js";

const billsCollection = db.collection("bills");
const countersCollection = db.collection("counters");

export const createBill = async (req, res) => {
  try {
    const { items, total } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bill must contain at least one item",
      });
    }

    if (total === undefined || Number(total) < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid total is required",
      });
    }

    // -----------------------------
    // Generate sequential bill number
    // -----------------------------

    const counterRef = countersCollection.doc("bills");

    const billNumber = await db.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);

      let nextNumber = 1;

      if (counterSnap.exists) {
        nextNumber = Number(counterSnap.data().lastNumber || 0) + 1;
      }

      transaction.set(
        counterRef,
        {
          lastNumber: nextNumber,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return nextNumber;
    });

    const formattedBillNumber = `BILL-${String(billNumber).padStart(6, "0")}`;

    // -----------------------------
    // Prepare bill items
    // -----------------------------

    const billItems = items.map((item) => ({
      itemId: item.itemId,
      name: String(item.name),
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.price) * Number(item.quantity),
    }));

    const calculatedTotal = billItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    // -----------------------------
    // Create bill
    // -----------------------------

    const billData = {
      billNumber: formattedBillNumber,

      items: billItems,

      total: calculatedTotal,

      createdBy: {
        uid: req.user.uid,
        email: req.user.email || null,
      },

      createdAt: new Date(),
    };

    const billRef = await billsCollection.add(billData);

    const billSnap = await billRef.get();

    res.status(201).json({
      success: true,
      message: "Bill created successfully",

      bill: {
        id: billSnap.id,
        ...billSnap.data(),
      },
    });
  } catch (error) {
    console.error("Create bill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create bill",
      error: error.message,
    });
  }
};


// GET ALL BILLS
export const getBills = async (req, res) => {
  try {
    const snapshot = await billsCollection
      .orderBy("createdAt", "desc")
      .get();

    const bills = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Get bills error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get bills",
      error: error.message,
    });
  }
};