import express from 'express'
import cors from 'cors'
import pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = pkg

const app = express()
app.use(cors())
app.use(express.json())

let client = null
let clientStatus = 'disconnected'
let currentQR = null

const initClient = () => {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: '/usr/bin/google-chrome', 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
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
    if (clientStatus === 'connected') return res.json({ success: true, message: 'Already connected' })
    clientStatus = 'connecting'
    if (client) {
      try { await client.destroy() } catch (e) {}
    }
    initClient()
    res.json({ success: true, message: 'Iniciando...' })
  } catch (error) {
    clientStatus = 'disconnected'
    res.json({ success: false, error: error.message })
  }
})

const getPhoneVariants = (phone) => {
  const variants = [phone]
  if (phone.startsWith('55') && phone.length >= 12) {
    const ddd = phone.slice(2, 4); const num = phone.slice(4)
    if (num.length === 8) variants.push('55' + ddd + '9' + num)
    else if (num.length === 9 && num.startsWith('9')) variants.push('55' + ddd + num.slice(1))
  }
  return variants
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

app.post('/send', async (req, res) => {
  const { contacts, message, delay = 5000 } = req.body
  if (clientStatus !== 'connected') return res.json({ success: false, error: 'WhatsApp not connected' })

  let successCount = 0; let failedCount = 0
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    console.log(`[${i + 1}/${contacts.length}] Enviando para ${contact.phone}...`)
    // Simulate typing delay (1-3 seconds)
    await sleep(1000 + Math.random() * 2000)

    try {
      // Personalize message with variables (handles {{nome}}, {{name}}, {{ nome }}, etc.)
      let personalizedMessage = message.replace(/{{\s*(nome|name)\s*}}/gi, contact.name || 'contato')
      
      const variants = getPhoneVariants(contact.phone); let sent = false
      for (const variant of variants) {
        const numberId = await client.getNumberId(variant)
        if (numberId) {
          await client.sendMessage(numberId._serialized, personalizedMessage)
          successCount++; sent = true; break
        }
      }
      if (!sent) {
        await client.sendMessage(`${contact.phone}@c.us`, personalizedMessage)
        successCount++
      }
      console.log(`[${i + 1}/${contacts.length}] Sucesso: ${contact.phone}`)
    } catch (error) { 
      failedCount++
      console.error(`[${i + 1}/${contacts.length}] Erro ao enviar para ${contact.phone}:`, error.message)
    }

    // Add delay between messages (except for the last one)
    if (i < contacts.length - 1) {
      // Base delay + random variation
      const randomVariation = Math.floor(Math.random() * 2000)
      let currentDelay = delay + randomVariation

      // Add a longer "human pause" every 5 messages
      if ((i + 1) % 5 === 0) {
        const pauseTime = 10000 + Math.random() * 5000
        console.log(`Pausa anti-ban prolongada: ${Math.round(pauseTime/1000)}s...`)
        currentDelay += pauseTime
      } else {
        console.log(`Aguardando ${Math.round(currentDelay/1000)}s para a próxima mensagem...`)
      }

      await sleep(currentDelay)
    }
  }
  console.log(`Lote finalizado. Sucesso: ${successCount}, Falhas: ${failedCount}`)
  res.json({ success: true, successCount, failedCount })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
