import { PrismaClient } from '@prisma/client';
import { Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '../src/types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@12345';

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Seed Demo Users (Upsert for idempotency)
  console.log('👤 Seeding demo users...');
  const usersData = [
    {
      email: 'admin@example.com',
      name: 'System Administrator',
      role: Role.ADMIN,
      passwordHash,
    },
    {
      email: 'sales@example.com',
      name: 'Sarah Jenkins (Sales)',
      role: Role.SALES,
      passwordHash,
    },
    {
      email: 'warehouse@example.com',
      name: 'Walter White (Warehouse)',
      role: Role.WAREHOUSE,
      passwordHash,
    },
    {
      email: 'accounts@example.com',
      name: 'Alice Cooper (Accounts)',
      role: Role.ACCOUNTS,
      passwordHash,
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash: u.passwordHash },
      create: u,
    });
    userMap[u.role] = user;
  }

  // 2. Seed Customers
  console.log('🏢 Seeding customers...');
  const customersData = [
    {
      name: 'Apex Electricals & Hardware',
      mobile: '+91 98765 43210',
      email: 'contact@apexelectricals.com',
      businessName: 'Apex Electricals Pvt Ltd',
      gstNumber: '27AABCU9603R1ZM',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Plot 45, MIDC Industrial Area, Pune, Maharashtra 411018',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-20'),
      notes: 'High volume partner. Eligible for wholesale tier discounts.',
    },
    {
      name: 'Metro Power Solutions',
      mobile: '+91 98220 11223',
      email: 'procurement@metropower.in',
      businessName: 'Metro Power Solutions LLP',
      gstNumber: '27AADFM2234K1Z4',
      customerType: CustomerType.WHOLESALE,
      address: 'Gala 12, Sunrise Complex, Goregaon East, Mumbai 400063',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-18'),
      notes: 'Requests monthly delivery schedules for switchgear items.',
    },
    {
      name: 'Shree Sai Industrial Supplies',
      mobile: '+91 94231 55667',
      email: 'info@shreesaisupplies.com',
      businessName: 'Shree Sai Enterprise',
      gstNumber: '24AAJFS4412H1ZQ',
      customerType: CustomerType.WHOLESALE,
      address: 'Shop 8, GIDC Commercial Hub, Surat, Gujarat 395006',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-25'),
      notes: 'Interested in bulk orders of industrial cables.',
    },
    {
      name: 'Prime Retail Mart',
      mobile: '+91 97112 33445',
      email: 'store@primeretail.com',
      businessName: 'Prime Retail Ventures',
      gstNumber: '07AAECP1123P1ZO',
      customerType: CustomerType.RETAIL,
      address: '14/B Ring Road, Connaught Place, New Delhi 110001',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-09-01'),
      notes: 'Retail showroom order for LED fixtures and home safety devices.',
    },
    {
      name: 'Nova Builders & Contractors',
      mobile: '+91 98450 99887',
      email: 'purchase@novabuilders.com',
      businessName: 'Nova Infrastructure Corp',
      gstNumber: '29AAACN8876Q1Z9',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Floor 5, Nova Towers, Whitefield, Bengaluru 560066',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-15'),
      notes: 'Commercial project wiring requirement in progress.',
    },
    {
      name: 'Sunrise Hardware Store',
      mobile: '+91 93211 44556',
      email: 'sunrise.hardware@gmail.com',
      businessName: 'Sunrise Hardware & Tools',
      gstNumber: null,
      customerType: CustomerType.RETAIL,
      address: 'Main Market Road, Nashik, Maharashtra 422001',
      status: CustomerStatus.LEAD,
      followUpDate: new Date('2026-08-14'),
      notes: 'Inquired about dealer pricing and minimum order quantities.',
    },
    {
      name: 'Vanguard Engineering Works',
      mobile: '+91 98900 66778',
      email: 'vendor@vanguardeng.com',
      businessName: 'Vanguard Engineering Works Ltd',
      gstNumber: '33AABCV5544J1Z8',
      customerType: CustomerType.WHOLESALE,
      address: 'SIDCO Industrial Estate, Guindy, Chennai 600032',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-28'),
      notes: 'Quarterly contract renewal scheduled for end of month.',
    },
    {
      name: 'Zenith Facility Management',
      mobile: '+91 97654 11229',
      email: 'ops@zenithfm.in',
      businessName: 'Zenith Integrated Services Pvt Ltd',
      gstNumber: '36AAACZ7765L1ZG',
      customerType: CustomerType.WHOLESALE,
      address: 'HITEC City, Madhapur, Hyderabad 500081',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-22'),
      notes: 'Maintenance lighting and circuit breaker supplier.',
    },
    {
      name: 'Omkar Electrical Spares',
      mobile: '+91 94112 88990',
      email: 'omkarelectric@rediffmail.com',
      businessName: 'Omkar Spares & Trading',
      gstNumber: null,
      customerType: CustomerType.RETAIL,
      address: 'Station Road, Indore, Madhya Pradesh 452001',
      status: CustomerStatus.LEAD,
      followUpDate: new Date('2026-08-16'),
      notes: 'Follow-up regarding catalog and credit terms.',
    },
    {
      name: 'Legacy Power Grid Ltd',
      mobile: '+91 99887 76655',
      email: 'contracts@legacypower.com',
      businessName: 'Legacy Power Corporation',
      gstNumber: '19AAACL9901M1ZT',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Salt Lake Sector V, Kolkata, West Bengal 700091',
      status: CustomerStatus.INACTIVE,
      followUpDate: null,
      notes: 'Account dormant due to vendor consolidation. Pending reconnect.',
    },
    {
      name: 'Dynamic Fasteners & Tools',
      mobile: '+91 98334 55678',
      email: 'orders@dynamicfasteners.com',
      businessName: 'Dynamic Industrial Fasteners LLP',
      gstNumber: '27AABCD6789N1ZV',
      customerType: CustomerType.WHOLESALE,
      address: 'Bhiwandi Warehousing Hub, Thane 421302',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-30'),
      notes: 'Consistently orders anchor bolts and mounting brackets.',
    },
  ];

  const seededCustomers = [];
  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (!existing) {
      const created = await prisma.customer.create({ data: c });
      seededCustomers.push(created);

      // Add sample follow-up note
      await prisma.followUpNote.create({
        data: {
          customerId: created.id,
          note: `Initial customer profile created. Lead status: ${c.status}. Follow-up scheduled for review.`,
          followUpDate: c.followUpDate || new Date(),
          createdById: userMap[Role.SALES].id,
        },
      });
    } else {
      seededCustomers.push(existing);
    }
  }

  // 3. Seed Products (16 products across multiple categories, some low-stock)
  console.log('📦 Seeding products and initial stock...');
  const productsData = [
    {
      name: 'Heavy Duty Armoured Cable 4-Core 16 sq mm',
      sku: 'CBL-ARM-4C16',
      category: 'Industrial Cables',
      unitPrice: 450.00,
      currentStock: 120,
      minimumStock: 40,
      location: 'Warehouse-A / Rack-01',
    },
    {
      name: 'Flexible Copper Conduit Wire 2.5 sq mm (90m)',
      sku: 'CBL-COP-25090',
      category: 'Industrial Cables',
      unitPrice: 1850.00,
      currentStock: 45,
      minimumStock: 50, // LOW STOCK
      location: 'Warehouse-A / Rack-02',
    },
    {
      name: 'Submersible Pump Flat Cable 3-Core (100m)',
      sku: 'CBL-SUB-3C100',
      category: 'Industrial Cables',
      unitPrice: 3200.00,
      currentStock: 8,
      minimumStock: 15, // LOW STOCK
      location: 'Warehouse-A / Rack-03',
    },
    {
      name: '3-Phase MCCB 100A 36kA Thermal Magnetic',
      sku: 'SWG-MCCB-3P100',
      category: 'Power Switchgear',
      unitPrice: 5800.00,
      currentStock: 35,
      minimumStock: 10,
      location: 'Warehouse-B / Bin-101',
    },
    {
      name: 'Miniature Circuit Breaker (MCB) Single Pole 16A C-Curve',
      sku: 'SWG-MCB-1P16',
      category: 'Power Switchgear',
      unitPrice: 145.00,
      currentStock: 350,
      minimumStock: 100,
      location: 'Warehouse-B / Bin-102',
    },
    {
      name: 'Residual Current Circuit Breaker (RCCB) 4P 40A 30mA',
      sku: 'SWG-RCCB-4P40',
      category: 'Power Switchgear',
      unitPrice: 2450.00,
      currentStock: 5,
      minimumStock: 20, // LOW STOCK
      location: 'Warehouse-B / Bin-103',
    },
    {
      name: 'Industrial LED High Bay Light 150W IP65',
      sku: 'LGT-HBY-150W',
      category: 'Lighting & Fixtures',
      unitPrice: 3400.00,
      currentStock: 80,
      minimumStock: 25,
      location: 'Warehouse-C / Bay-01',
    },
    {
      name: 'Commercial LED Flood Light 100W Outdoor',
      sku: 'LGT-FLD-100W',
      category: 'Lighting & Fixtures',
      unitPrice: 1650.00,
      currentStock: 60,
      minimumStock: 20,
      location: 'Warehouse-C / Bay-02',
    },
    {
      name: 'Commercial LED Batten 20W Cool Daylight (Pack of 10)',
      sku: 'LGT-BAT-20W10',
      category: 'Lighting & Fixtures',
      unitPrice: 2100.00,
      currentStock: 12,
      minimumStock: 30, // LOW STOCK
      location: 'Warehouse-C / Bay-03',
    },
    {
      name: 'Industrial Safety Helmet HDPE with Chin Strap (Yellow)',
      sku: 'SFT-HLM-HDPE-Y',
      category: 'Safety Equipment',
      unitPrice: 220.00,
      currentStock: 250,
      minimumStock: 50,
      location: 'Warehouse-D / Sec-01',
    },
    {
      name: 'High Voltage Insulated Electrical Gloves (Class 0 1000V)',
      sku: 'SFT-GLV-HV1K',
      category: 'Safety Equipment',
      unitPrice: 890.00,
      currentStock: 15,
      minimumStock: 30, // LOW STOCK
      location: 'Warehouse-D / Sec-02',
    },
    {
      name: 'Full Body Fall Protection Harness CE Certified',
      sku: 'SFT-HRN-FBCE',
      category: 'Safety Equipment',
      unitPrice: 1750.00,
      currentStock: 40,
      minimumStock: 15,
      location: 'Warehouse-D / Sec-03',
    },
    {
      name: 'Stainless Steel Heavy Anchor Fastener M12 x 100mm (Box 50)',
      sku: 'FST-ANC-M12100',
      category: 'Fasteners & Hardware',
      unitPrice: 950.00,
      currentStock: 180,
      minimumStock: 40,
      location: 'Warehouse-E / Row-1',
    },
    {
      name: 'Galvanized Hex Head Bolt & Nut Set M10 x 50mm (Box 100)',
      sku: 'FST-BLT-M1050',
      category: 'Fasteners & Hardware',
      unitPrice: 720.00,
      currentStock: 220,
      minimumStock: 50,
      location: 'Warehouse-E / Row-2',
    },
    {
      name: 'Cable Ties UV Resistant Heavy Duty 300mm (Pack 100)',
      sku: 'FST-TIE-300UV',
      category: 'Fasteners & Hardware',
      unitPrice: 180.00,
      currentStock: 600,
      minimumStock: 150,
      location: 'Warehouse-E / Row-3',
    },
    {
      name: 'Digital Multimeter True RMS Auto-Ranging 600V',
      sku: 'INS-DMM-TRMS600',
      category: 'Testing & Instruments',
      unitPrice: 3850.00,
      currentStock: 22,
      minimumStock: 10,
      location: 'Warehouse-B / Locker-5',
    },
  ];

  const seededProducts: Record<string, any> = {};
  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          category: p.category,
          unitPrice: p.unitPrice,
          currentStock: p.currentStock,
          minimumStock: p.minimumStock,
          location: p.location,
        },
      });
      seededProducts[p.sku] = created;

      // Create initial stock IN movement for audit trail
      if (p.currentStock > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: created.id,
            quantity: p.currentStock,
            type: MovementType.IN,
            reason: 'Initial stock intake from warehouse inventory audit',
            createdById: userMap[Role.WAREHOUSE].id,
          },
        });
      }
    } else {
      seededProducts[p.sku] = existing;
    }
  }

  // 4. Seed Sales Challans (Draft and Confirmed)
  console.log('📄 Seeding initial sales challans...');
  const challan1Number = 'CH-2026-000001';
  const existingChallan1 = await prisma.salesChallan.findUnique({ where: { challanNumber: challan1Number } });

  if (!existingChallan1 && seededCustomers[0]) {
    const p1 = seededProducts['CBL-ARM-4C16'] || (await prisma.product.findUnique({ where: { sku: 'CBL-ARM-4C16' } }));
    const p2 = seededProducts['SWG-MCB-1P16'] || (await prisma.product.findUnique({ where: { sku: 'SWG-MCB-1P16' } }));

    if (p1 && p2) {
      await prisma.salesChallan.create({
        data: {
          challanNumber: challan1Number,
          customerId: seededCustomers[0].id,
          totalQuantity: 25,
          status: ChallanStatus.DRAFT,
          createdById: userMap[Role.SALES].id,
          items: {
            create: [
              {
                productId: p1.id,
                productNameSnapshot: p1.name,
                skuSnapshot: p1.sku,
                unitPriceSnapshot: p1.unitPrice,
                quantity: 10,
              },
              {
                productId: p2.id,
                productNameSnapshot: p2.name,
                skuSnapshot: p2.sku,
                unitPriceSnapshot: p2.unitPrice,
                quantity: 15,
              },
            ],
          },
        },
      });
    }
  }

  const challan2Number = 'CH-2026-000002';
  const existingChallan2 = await prisma.salesChallan.findUnique({ where: { challanNumber: challan2Number } });

  if (!existingChallan2 && seededCustomers[1]) {
    const p1 = seededProducts['LGT-HBY-150W'] || (await prisma.product.findUnique({ where: { sku: 'LGT-HBY-150W' } }));
    const p2 = seededProducts['FST-ANC-M12100'] || (await prisma.product.findUnique({ where: { sku: 'FST-ANC-M12100' } }));

    if (p1 && p2) {
      // Create confirmed challan
      const qty1 = 5;
      const qty2 = 10;
      const totalQty = qty1 + qty2;

      const confirmedChallan = await prisma.salesChallan.create({
        data: {
          challanNumber: challan2Number,
          customerId: seededCustomers[1].id,
          totalQuantity: totalQty,
          status: ChallanStatus.CONFIRMED,
          createdById: userMap[Role.SALES].id,
          items: {
            create: [
              {
                productId: p1.id,
                productNameSnapshot: p1.name,
                skuSnapshot: p1.sku,
                unitPriceSnapshot: p1.unitPrice,
                quantity: qty1,
              },
              {
                productId: p2.id,
                productNameSnapshot: p2.name,
                skuSnapshot: p2.sku,
                unitPriceSnapshot: p2.unitPrice,
                quantity: qty2,
              },
            ],
          },
        },
      });

      // Record corresponding OUT movements for the confirmed challan
      await prisma.stockMovement.createMany({
        data: [
          {
            productId: p1.id,
            quantity: qty1,
            type: MovementType.OUT,
            reason: `Dispatched against Sales Challan ${challan2Number}`,
            createdById: userMap[Role.WAREHOUSE].id,
          },
          {
            productId: p2.id,
            quantity: qty2,
            type: MovementType.OUT,
            reason: `Dispatched against Sales Challan ${challan2Number}`,
            createdById: userMap[Role.WAREHOUSE].id,
          },
        ],
      });
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
