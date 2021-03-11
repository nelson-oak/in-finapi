const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer) {
    return response.status(400).json({
      error: 'Customer does not exists!'
    })
  }

  request.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc += operation.amount
    } else {
      return acc -= operation.amount
    }
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if(customerAlreadyExists) {
    return response.status(400).json({
      error: 'Customer already exists!',
    })
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: [],
  })

  return response.status(201).send()
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  
  const { description, amount } = request.body

  const statementOperation = {
    description,
    amount,
    type: 'credit',
    created_at: new Date(),
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  
  const { amount } = request.body

  const balance = getBalance(customer.statement)

  if(balance < amount) {
    return response.status(400).json({
      error: "Insufficient funds!"
    })
  }

  const statementOperation = {
    amount,
    type: 'debit',
    created_at: new Date(),
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  const { date } = request.query

  const dateFormat = new Date(date + " 00:00")

  const statementByDate = customer.statement.filter(statement => (
    statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  ))

  return response.json(statementByDate)
})

app.listen(3333)