const express = require("express");
const low = require("lowdb");
const shortid = require("shortid");

const bearer = require("../middlewares/bearer");
const FileSync = require("lowdb/adapters/FileSync");

const adapterPriceList = new FileSync("pricelist.json");
const dbPricelist = low(adapterPriceList);

const adapterDocuments = new FileSync("documents.json");
const dbDocuments = low(adapterDocuments);

const router = express.Router();

router.post("/pricelist", bearer, (req, res) => {
  console.log("Price list from 1C:");
  //console.log(req.body);

  if (req.body.positions === undefined) {
    res.status(204).send({ result: "no data" });
  }
  positions = req.body.positions;

  positions.forEach(element => {
    dbPricelist
      .get("products")
      .push({ element })
      .write();
  });

  res.status(200).send({ result: "success" });
});

router.delete("/pricelist", bearer, (req, res) => {
  console.log("DELETE price list from 1c");

  dbPricelist.defaults({ products: [] }).write();

  dbPricelist
    .get("products")
    .remove()
    .write();

  res.status(200).send({ result: "success" });
});

router.post("/successdocuments", bearer, (req, res) => {
  console.log("Success download Documents from 1C:");
  console.log(req.body);

  if (req.body.documents === undefined) {
    res.status(204).send({ result: "no data" });
  }
  documents = req.body.documents;

  documents.forEach(element => {
    dbDocuments
      .get("documents")
      .find({ id_doc: element.document_uid })
      .assign({ mark: false })
      .write();
  });

  res.status(200).send({ result: "success" });
});

router.get("/documents", bearer, (req, res) => {
  console.log("GET Documents!");
  console.log(req.query);

  documents = dbDocuments
    .get("documents")
    .filter({ mark: true })
    .value();

  res.status(200).send({
    result: documents.map(item => item)
  });
});

router.post("/document", bearer, (req, res) => {
  console.log("Add new document to db");
  //console.log(req.body);

  const newDocumentId = shortid.generate();

  dbDocuments
    .get("documents")
    .push({
      id_doc: newDocumentId,
      mark: false,
      archived: false,
      date: new Date(),
      positions: []
    })
    .write();

  //console.log(newDocumentId);

  const post = dbDocuments.get("documents").find({ id_doc: newDocumentId });

  if (post) {
    const postValue = post.value();
    res.json({
      id: postValue.id_doc,
      date: postValue.date
    });
  } else {
    res.status(400).send({ result: "Error create new document" });
  }
});

router.delete("/document/:id", bearer, (req, res) => {
  console.log("DELETE document by id");

  dbDocuments
    .get("documents")
    .remove({ id_doc: req.params.id })
    .write();

  res.status(200).send({ result: "success" });
});

router.post("/position/:id", bearer, (req, res) => {
  console.log("Add new position in document");
  //console.log(req.body);

  // if (req.body === undefined) {
  //   res.status(204).send({ result: "no data" });
  // }

  const position_id = shortid.generate();
  const newPosition = {
    position_id: position_id,
    product_code: req.body.product_code,
    count: req.body.count,
    price: req.body.price
  };

  const positions = dbDocuments
    .get("documents")
    .find({ id_doc: req.params.id })
    .get("positions")
    .value();

  if (positions) {
    positions.push(newPosition);

    dbDocuments
      .get("documents")
      .find({ id_doc: req.params.id })
      .assign({ positions })
      .write();

    res.json({
      position_id: position_id
    });
  } else {
    res.status(400).send({ result: "Not found document by id" });
  }
});

router.delete("/position/:document_id/:position_id", bearer, (req, res) => {
  console.log("Delete position from document by ID");
  console.log(req.params.document_id);
  console.log(req.params.position_id);

  const documents = dbDocuments
    .get("documents")
    .find({ id_doc: req.params.document_id })
    .value();

  console.log(documents);
  if (documents) {
    const positions = dbDocuments
      .get("documents")
      .find({ id_doc: req.params.document_id })
      .get("positions")
      .find({ position_id: req.params.position_id })
      .value();

    if (positions) {
      dbDocuments
        .get("documents")
        .find({ id_doc: req.params.document_id })
        .get("positions")
        .remove({ position_id: req.params.position_id })
        .write();

      res.json({
        success: true
      });
    } else {
      res.status(400).send({ result: "Not found position in document by id" });
    }
  } else {
    res.status(400).send({ result: "Not found document by id" });
  }
});

module.exports = router;
