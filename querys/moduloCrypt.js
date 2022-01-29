const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const criptar = {};

//donde invoques esto con modulo, tendrás que aplicarlo con await.
criptar.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10); //puedes generar 10 iteraciones, más o menos de la sal
  const hash = await bcrypt.hash(password, salt); //con esto generas el hash
  return hash;
};

criptar.matchPassword = async (password, savedPassword) => {
  try {
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e)
  }
};

module.exports = criptar;