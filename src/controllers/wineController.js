import { getAllWines, getWineById } from '../models/wineModel.js';

export const listWines = async (req, res) => {
  try {
    const wines = await getAllWines();

    const adjustedWines = wines.map(wine => {
      let precio = parseFloat(wine.costo);

      // Ajuste según rol
      if (req.user.rol_id === 2) precio *= 1.05;
      else if (req.user.rol_id === 3) precio *= 1.20;

      return { ...wine, costo: precio.toFixed(2) };
    });

    res.json(adjustedWines);
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
