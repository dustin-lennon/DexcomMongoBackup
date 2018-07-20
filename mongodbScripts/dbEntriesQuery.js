db.entries.find({
  dateString: {
    $lt: "2016-01-01"
  }
}).sort({
  dateString: -1
})