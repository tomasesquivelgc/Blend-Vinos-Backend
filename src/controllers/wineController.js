import { getAllWines, getWineById, createWine, updateWine, deleteWine } from '../models/wineModel.js';
import { addHistory } from '../models/historyModel.js';

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

// CREATE
export const addWine = async (req, res) => {
  try {
    const newWine = await createWine(req.body);

    // Log history
    await addHistory({
      vino_id: newWine.id,
      usuario_id: req.user.id,
      accion: "CREATE",
      cantidad: req.body.cantidad,
      costo: req.body.costo,
      comentario: "Wine created",
      vino_nombre: newWine.nombre
    });

    res.status(201).json(newWine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
export const editWine = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedWine = await updateWine(id, req.body);
    if (!updatedWine) return res.status(404).json({ message: "Wine not found" });

    // Log history
    await addHistory({
      vino_id: id,
      usuario_id: req.user.id,
      accion: "UPDATE",
      cantidad: req.body.cantidad,
      costo: req.body.costo,
      comentario: "Wine updated",
      vino_nombre: updatedWine.nombre
    });

    res.json(updatedWine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const removeWine = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWine = await deleteWine(id);
    if (!deletedWine) return res.status(404).json({ message: "Wine not found" });

    // Log history
    await addHistory({
      vino_id: null,
      usuario_id: req.user.id,
      accion: "DELETE",
      cantidad: deletedWine.cantidad,
      costo: deletedWine.costo,
      comentario: "Wine deleted",
      vino_nombre: deletedWine.nombre

    });

    res.json({ message: "Wine deleted", wine: deletedWine });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};