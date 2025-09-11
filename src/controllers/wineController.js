import { getAllWines, getWineById, createWine, updateWine, deleteWine, getWineByCodigo, getWineByCodigoDeBarras } from '../models/wineModel.js';
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
    res.status(500).json({ error: error.message, message: "Error al obtener vinos" });
  }
};

export const getWine = async (req, res) => {
  try {
    const { id } = req.params;
    const wine = await getWineById(id);
    if (!wine) return res.status(404).json({ message: "Vino no encontrado" });
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
      accion: "CREAR",
      cantidad: req.body.cantidad,
      costo: req.body.costo,
      comentario: "Vino creado",
      vino_nombre: newWine.nombre
    });

    res.status(201).json(newWine);
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al crear vino" });
  }
};

// UPDATE
export const editWine = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedWine = await updateWine(id, req.body);
    if (!updatedWine) return res.status(404).json({ message: "Vino no encontrado" });

    // Log history
    await addHistory({
      vino_id: id,
      usuario_id: req.user.id,
      accion: "ACTUALIZAR",
      cantidad: req.body.cantidad,
      costo: req.body.costo,
      comentario: "Vino actualizado",
      vino_nombre: updatedWine.nombre
    });

    res.json(updatedWine);
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al actualizar vino" });
  }
};

// DELETE
export const removeWine = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWine = await deleteWine(id);
    if (!deletedWine) return res.status(404).json({ message: "Vino no encontrado" });

    // Log history
    await addHistory({
      vino_id: null,
      usuario_id: req.user.id,
      accion: "ELIMINAR",
      cantidad: deletedWine.cantidad,
      costo: deletedWine.costo,
      comentario: "Vino eliminado",
      vino_nombre: deletedWine.nombre

    });

    res.json({ message: "Vino eliminado exitosamente", wine: deletedWine });
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al eliminar vino" });
  }
};

// FIND BY CODE

export const findWineByCode = async (req, res) => {
  try {
    const { code } = req.params;
    //if codigo is only numbers, then use getWineByCodigoDeBarras else use getWineByCodigo
    const wine = /^\d+$/.test(code) ? await getWineByCodigoDeBarras(code) : await getWineByCodigo(code);
    if (!wine) return res.status(404).json({ message: "Vino no encontrado" });
    res.json(wine);
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al obtener vino" });
    console.error(error);
    throw error;
  }
};