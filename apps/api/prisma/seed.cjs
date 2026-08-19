const { randomUUID } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const SEED_FOLDER = 'Due Diligence'
const ARCHIVE_FILE_COUNT = 70

const pdf = Buffer.from(
  `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 612 792] >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>endobj
4 0 obj<< /Length 55 >>stream
BT /F1 18 Tf 72 720 Td (Acme Data Room seed) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000145 00000 n 
0000000332 00000 n 
trailer<< /Root 1 0 R /Size 5 >>
startxref
437
%%EOF`,
)

async function mapPool(items, limit, fn) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await fn(items[current], current)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )
  return results
}

async function uploadPdf(key) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'dataroom-files'

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.',
    )
  }

  const encoded = key.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encoded}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: pdf,
    },
  )

  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status})`)
  }
}

async function createFile(folderId, dataRoomId, uploadedById, name) {
  const id = randomUUID()
  const storageKey = `${dataRoomId}/${id}.pdf`
  await uploadPdf(storageKey)
  return prisma.file.create({
    data: {
      id,
      name,
      mimeType: 'application/pdf',
      sizeBytes: pdf.length,
      storageKey,
      folderId,
      dataRoomId,
      uploadedById,
    },
  })
}

async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase()
  if (!email) {
    throw new Error(
      'Set SEED_EMAIL to an account that has already signed in once.',
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error(
      `No user for ${email}. Sign in with Google first, then seed.`,
    )
  }

  const room = await prisma.dataRoom.findFirst({ where: { ownerId: user.id } })
  const root = room
    ? await prisma.folder.findFirst({
        where: { dataRoomId: room.id, isRoot: true },
      })
    : null

  if (!room || !root) {
    throw new Error('User has no data room yet. Open the app once after login.')
  }

  const alreadySeeded = await prisma.folder.findFirst({
    where: { parentId: root.id, name: SEED_FOLDER },
  })

  if (alreadySeeded) {
    console.log(`Seed already present for ${email}, skipping.`)
    return
  }

  const dueDiligence = await prisma.folder.create({
    data: {
      name: SEED_FOLDER,
      dataRoomId: room.id,
      parentId: root.id,
      createdById: user.id,
    },
  })
  const legal = await prisma.folder.create({
    data: {
      name: 'Legal',
      dataRoomId: room.id,
      parentId: root.id,
      createdById: user.id,
    },
  })
  const finance = await prisma.folder.create({
    data: {
      name: 'Finance',
      dataRoomId: room.id,
      parentId: root.id,
      createdById: user.id,
    },
  })
  const people = await prisma.folder.create({
    data: {
      name: 'People',
      dataRoomId: room.id,
      parentId: root.id,
      createdById: user.id,
    },
  })
  const contracts = await prisma.folder.create({
    data: {
      name: 'Contracts',
      dataRoomId: room.id,
      parentId: legal.id,
      createdById: user.id,
    },
  })
  const corporate = await prisma.folder.create({
    data: {
      name: 'Corporate',
      dataRoomId: room.id,
      parentId: legal.id,
      createdById: user.id,
    },
  })
  const q1 = await prisma.folder.create({
    data: {
      name: 'Q1 statements',
      dataRoomId: room.id,
      parentId: finance.id,
      createdById: user.id,
    },
  })
  const archive = await prisma.folder.create({
    data: {
      name: 'Archive',
      dataRoomId: room.id,
      parentId: finance.id,
      createdById: user.id,
    },
  })

  const named = [
    [dueDiligence.id, 'Confidential Information Memorandum.pdf'],
    [dueDiligence.id, 'Process letter.pdf'],
    [dueDiligence.id, 'Management presentation.pdf'],
    [contracts.id, 'Master services agreement.pdf'],
    [contracts.id, 'NDA - Acme.pdf'],
    [contracts.id, 'Employment agreement template.pdf'],
    [corporate.id, 'Certificate of incorporation.pdf'],
    [corporate.id, 'Cap table.pdf'],
    [q1.id, 'Q1 P&L.pdf'],
    [q1.id, 'Q1 cash flow.pdf'],
    [people.id, 'Org chart.pdf'],
    [root.id, 'Welcome to the data room.pdf'],
  ]

  await mapPool(named, 6, ([folderId, name]) =>
    createFile(folderId, room.id, user.id, name),
  )

  const archiveNames = Array.from(
    { length: ARCHIVE_FILE_COUNT },
    (_, index) => `Exhibit ${String(index + 1).padStart(2, '0')}.pdf`,
  )
  await mapPool(archiveNames, 8, (name) =>
    createFile(archive.id, room.id, user.id, name),
  )

  console.log(`Seeded demo folders and PDFs for ${email}.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
