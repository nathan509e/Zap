import express from 'express'
import cors from 'cors'
import { Client, LocalAuth } from 'whatsapp-web.js'

const app = express()
app.use(cors())
app.use(express.json())

let client = null
let clientStatus = 'disconnected'
let currentQR = null

const initClient = () => {
  client = new Client({
    authStrategy: new LocalAuth(), // Salva a sessão para não precisar scanear sempre
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  })

  client.on('qr', (qr) => {
    console.log('QR Code recebido')
    currentQR = qr
    clientStatus = 'qr'
  })

  client.on('ready', () => {
    console.log('WhatsApp client ready!')
    clientStatus = 'connected'
    currentQR = null
  })

  client.on('authenticated', () => {
    console.log('Autenticado!')
    currentQR = null
    clientStatus = 'connecting'
  })

  client.on('disconnected', () => {
    console.log('WhatsApp client disconnected')
    clientStatus = 'disconnected'
    currentQR = null
    client = null
  })

  client.on('auth_failure', () => {
    console.log('Auth failure')
    clientStatus = 'disconnected'
    currentQR = null
    client = null
  })

  client.initialize()
}

app.get('/status', (req, res) => {
  res.json({ status: clientStatus })
})

app.get('/qr', (req, res) => {
  if (clientStatus === 'qr' && currentQR) {
    res.json({ qr: currentQR, status: 'qr' })
  } else {
    res.json({ qr: null, status: clientStatus })
  }
})

app.post('/connect', async (req, res) => {
  try {
    if (clientStatus === 'connected') {
      return res.json({ success: true, message: 'Already connected' })
    }

    if (clientStatus === 'connecting' || clientStatus === 'qr') {
      return res.json({ success: true, message: 'Already initializing' })
    }

    clientStatus = 'connecting'
    currentQR = null

    if (client) {
      try { await client.destroy() } catch (e) {}
      client = null
    }

    initClient()

    res.json({ success: true, message: 'Iniciando... aguarde o QR code' })
  } catch (error) {
    console.error('Connection error:', error)
    clientStatus = 'disconnected'
    res.json({ success: false, error: error.message })
  }
})

// Gera variações do número para tentar resolver (com/sem 9 dígito BR)
const getPhoneVariants = (phone) => {
  const variants = [phone]
  // Números brasileiros: 55 + DDD(2) + número(8 ou 9 dígitos)
  if (phone.startsWith('55') && phone.length >= 12) {
    const ddd = phone.slice(2, 4)
    const num = phone.slice(4)
    if (num.length === 8) {
      // Adiciona o 9 na frente
      variants.push('55' + ddd + '9' + num)
    } else if (num.length === 9 && num.startsWith('9')) {
      // Remove o 9 da frente
      variants.push('55' + ddd + num.slice(1))
    }
  }
  return variants
}

app.post('/send', async (req, res) => {
  const { contacts, message } = req.body

  if (!contacts || !message) {
    return res.json({ success: false, error: 'Missing contacts or message' })
  }

  if (clientStatus !== 'connected') {
    return res.json({ success: false, error: 'WhatsApp not connected' })
  }

  let successCount = 0
  let failedCount = 0

  for (const contact of contacts) {
    try {
      const variants = getPhoneVariants(contact.phone)
      let sent = false

      // Tenta cada variação do número com getNumberId()
      for (const variant of variants) {
        const numberId = await client.getNumberId(variant)
        if (numberId) {
          await client.sendMessage(numberId._serialized, message)
          successCount++
          console.log(`✓ Enviado para ${contact.phone} → ${numberId._serialized}`)
          sent = true
          break
        }
      }

      // Fallback: envia direto com @c.us se getNumberId falhou em todas as variações
      if (!sent) {
        const chatId = `${contact.phone}@c.us`
        console.log(`⚠ getNumberId falhou para ${contact.phone}, tentando fallback: ${chatId}`)
        await client.sendMessage(chatId, message)
        successCount++
        console.log(`✓ Enviado via fallback para ${chatId}`)
      }
    } catch (error) {
      failedCount++
      console.error(`✗ Falha ao enviar para ${contact.phone}:`, error.message)
    }
  }

  res.json({ 
    success: true, 
    successCount, 
    failedCount 
  })
})

app.post('/disconnect', async (req, res) => {
  try {
    if (client) {
      await client.destroy()
      client = null
    }
    clientStatus = 'disconnected'
    currentQR = null
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})