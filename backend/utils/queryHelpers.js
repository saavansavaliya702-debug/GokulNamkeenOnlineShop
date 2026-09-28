const { Op } = require("sequelize");

function buildAttributesOption(include, exclude) {
    if (include && include.trim() !== '') {
      return include.split(',').map(attr => attr.trim());
    } else if (exclude && exclude.trim() !== '') {
      return { exclude: exclude.split(',').map(attr => attr.trim()) };
    }
    return undefined;
  }
  
function buildSearchOrCondition(model, columns, searchString = "", sequelize) {
  // Determine cast type based on dialect
  let castType = 'TEXT';
  if (sequelize.getDialect() === 'mysql') {
    castType = 'CHAR';
  } else if (sequelize.getDialect() === 'sqlite') {
    castType = 'TEXT';
  }

  // Allowed Sequelize type keys
  const allowedTypes = ['STRING', 'TEXT', 'INTEGER', 'BIGINT', 'BOOLEAN', 'DATE'];

  // Filter columns to only allowed types
  columns = columns.filter(col => {
    const attr = model.rawAttributes[col];
    return attr && attr.type && allowedTypes.includes(attr.type.key); 
  });

  // Build Op.or array
  return columns.map(colName => {
    // Always cast to string for substring search
    return sequelize.literal(`CAST(${colName} AS ${castType}) iLIKE '%${searchString?.toLowerCase() || ''}%'`);
  });
}

const getWhereConditionFromQuery = (query) => {
  const where = {}
  Object.keys(query).forEach((key) => {
    const match = key.match(/^where\[(.+)\]$/); // match keys like where[rto_id]
    if (match) {
      const field = match[1]; // e.g. 'rto_id'
      const value = query[key];
      // Convert numeric strings to numbers if applicable
      where[field] = isNaN(value) ? value : Number(value);
    }
  });
  return where;
}
const buildPayload = (inputData, oldRecord, allowedFields) => {
  const payload = {};

  allowedFields.forEach((key) => {
    if (inputData[key] !== undefined && inputData[key] !== null && inputData[key] !== '') {
      payload[key] = inputData[key];            // NEW VALUE FROM REQ
    } else if (oldRecord) {
      payload[key] = oldRecord[key];            // CLONE FROM OLD
    } else {
      payload[key] = null;                      // DEFAULT NULL
    }
  });

  return payload;
};

const getModelFields = (model, exclude = []) => {
  return Object.keys(model.rawAttributes).filter(
    (field) => !exclude.includes(field)
  );
};

const cloneAndCreate = async (
  Model,
  inputData,
  id,
  excludeFields,
  transaction,
  extra = {},
  options = { optional: false }
) => {
  let oldRecord = null;
  let refId = null;
  let type = 'new';

  if (id) {
    // console.log('id>>>',id);
    // console.log('Model>>>',Model);
    oldRecord = await Model.findOne({
      where: { id, is_delete: false },
      transaction
    });

    // if (!oldRecord) throw new Error(`Record not found`);
    if (!oldRecord) {
      if (options.optional) {
        console.warn(`⚠️ ${Model.name} old record not found for id ${id}. Skipping.`);
        return null;
      } else {
        throw new Error(`${Model.name} record not found`);
      }
    }

    refId = oldRecord.id;
    type = 'old';
  }

  const fields = getModelFields(Model, excludeFields);
  const payload = buildPayload(inputData, oldRecord, fields);

  return Model.create({
    ...payload,
    ...extra,
    ref_id: refId,
    type,
    is_final: false
  }, { transaction });
};

const reportsWorkType = async (WorkCategory, WorkType) => {

  // console.log('WorkType--->>>', WorkType);

  let type ;

  if (WorkType === "new_rc") {
    type = "New RC";
  } 
  if (WorkType === "old_rc") {
    type = "Old RC";
  } 
  if (WorkType === "dl") {
    type = "DL";
  }
  if (WorkType === "bulk_new_rc") {
    type = "BULK NEW RC";
  }
  if (WorkType === "common") {
    type = "All";
  }
  
  let workCategory;

  if (type === "All") {
    workCategory = await WorkCategory.findAll(
      { is_delete: false }
    );

    const Ids = workCategory.map(el => el.id).join(',');

    return {
      ids: Ids
    }
  }

  else {
    workCategory = await WorkCategory.findOne(
      { 
        where:  { name: type }, 
        is_delete: false 
      }
    );

    return {
      id: workCategory?.id
    }
  }

}

// const safeDate = (val) => {
//   if (!val) return null;

//   if (val === "Invalid date" || val === "Invalid Date") return null;

//   const d = new Date(val);
//   return isNaN(d.getTime()) ? null : d;
// };

const safeDate = (val) => {
  if (!val) return null;

  if (val === "Invalid date" || val === "Invalid Date") return null;

  // If it is ISO string
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  // If it is Dayjs-like object from frontend JSON
  if (typeof val === "object") {
    if (val.$y && val.$M !== undefined && val.$D) {
      const d = new Date(
        val.$y,
        val.$M,
        val.$D,
        val.$H || 0,
        val.$m || 0,
        val.$s || 0,
        val.$ms || 0
      );
      return isNaN(d.getTime()) ? null : d;
    }

    // If already JS Date object
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }
  }

  // fallback
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const safeNumber = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

module.exports = { buildAttributesOption, buildSearchOrCondition, getWhereConditionFromQuery, buildPayload, getModelFields, cloneAndCreate, reportsWorkType, safeDate, safeNumber };