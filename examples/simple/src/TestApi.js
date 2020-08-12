const handleRead = async (event, context) => {
  return {
    statusCode: 200,
    body: "HELLO WORLD",
    headers: {
      "Content-Type": "text/plain"
    }
  }
}

module.exports = { handleRead }
