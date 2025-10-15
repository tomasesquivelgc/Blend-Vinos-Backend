import { getAllWines, getWineById, createWine, updateWine, deleteWine, getWineByCodigo, getWineByCodigoDeBarras, getAllWinesPaginated, getWineByNombrePartial } from '../models/wineModel.js';
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

export const listWinesPaginated = async (req, res) => {
  try {
    // Parse page and limit as integers, provide defaults if not present or invalid
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;
    const order = req.query.order;
    const orderBy = req.query.orderBy;
    const wines = await getAllWinesPaginated(page, limit, order, orderBy);
    res.json(wines);
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al obtener vinos" });
    throw error;
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
    let wines = [];

    // If code is only numbers, search by barcode
    if (/^\d+$/.test(code)) {
      const wine = await getWineByCodigoDeBarras(code);
      if (wine) wines.push(wine);
    } else {
      // Search by alphanumeric code
      const wine = await getWineByCodigo(code);
      if (wine) wines.push(wine);
    }

    // Always search by name (partial, case-insensitive)
    const nameMatches = await getWineByNombrePartial(code);
    if (nameMatches && nameMatches.length > 0) {
      // Merge results but avoid duplicates
      const existingIds = new Set(wines.map(w => w.id));
      nameMatches.forEach(w => {
        if (!existingIds.has(w.id)) wines.push(w);
      });
    }

    if (wines.length === 0) {
      return res.status(404).json({ message: "Vino no encontrado" });
    }

    res.json(wines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Error al obtener vino" });
  }
};
