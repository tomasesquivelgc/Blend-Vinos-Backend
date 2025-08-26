import { getAllWines, getWineById } from '../models/wineModel.js';

export const listWines = async (req, res) => {
  try {
    const wines = await getAllWines();
    res.json(wines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWine = async (req, res) => {
  try {
    const { id } = req.params;
    const wine = await getWineById(id);
    if (!wine) return res.status(404).json({ message: "Wine not found" });
    res.json(wine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
