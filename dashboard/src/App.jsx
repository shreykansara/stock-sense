import React, { useState } from 'react';
import {
  Logo,
  Button,
  Badge,
  TextInput,
  SearchInput,
  BarcodeScannerInput,
  Select,
  Checkbox,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Pagination,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  Sidebar,
  Header,
  Breadcrumb,
  Tabs,
  Modal,
  Drawer,
  Alert,
} from './dls';

import {
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  ExternalLink,
  Plus,
  RefreshCw,
  ScanBarcode,
  Sliders,
  CheckCircle,
} from 'lucide-react';

import './App.css';

// Sample inventory items for live interactive table
const INITIAL_INVENTORY = [
  {
    sku: 'SKU-00918',
    barcode: '840192841029',
    name: 'Precision Hydraulic Bearing 45mm',
    category: 'Mechanical',
    location: 'WH01-A12-R3',
    onHand: 240,
    available: 215,
    unitCost: '$38.50',
    status: 'in_stock',
    statusLabel: 'In Stock',
  },
  {
    sku: 'SKU-00842',
    barcode: '840192841088',
    name: 'Industrial Sensor Transducer v3',
    category: 'Electronics',
    location: 'WH01-B04-R1',
    onHand: 14,
    available: 4,
    unitCost: '$124.00',
    status: 'low_stock',
    statusLabel: 'Low Stock',
  },
  {
    sku: 'SKU-00711',
    barcode: '840192841103',
    name: 'Reinforced Carbon Gasket Ring',
    category: 'Seals & Gaskets',
    location: 'WH01-C09-R2',
    onHand: 0,
    available: 0,
    unitCost: '$16.20',
    status: 'stockout',
    statusLabel: 'Stockout',
  },
  {
    sku: 'SKU-00654',
    barcode: '840192841299',
    name: 'Lithium Iron Battery Module 48V',
    category: 'Power Units',
    location: 'WH01-D02-R4',
    onHand: 62,
    available: 62,
    unitCost: '$410.00',
    status: 'draft',
    statusLabel: 'In Transit',
  },
  {
    sku: 'SKU-00523',
    barcode: '840192841315',
    name: 'Stainless Steel Fastener Kit (M8)',
    category: 'Hardware',
    location: 'WH01-A01-R2',
    onHand: 1250,
    available: 1100,
    unitCost: '$4.75',
    status: 'in_stock',
    statusLabel: 'In Stock',
  },
  {
    sku: 'SKU-00419',
    barcode: '840192841440',
    name: 'Rotary Actuator Pneumatic 90deg',
    category: 'Pneumatics',
    location: 'WH01-B08-R3',
    onHand: 6,
    available: 2,
    unitCost: '$88.00',
    status: 'low_stock',
    statusLabel: 'Low Stock',
  },
];

export function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanHistory, setScanHistory] = useState([
    '840192841029: SKU-00918 scanned at Station #02',
    '840192841088: SKU-00842 scanned at Station #01',
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});

  // Filter items
  const filteredItems = INITIAL_INVENTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScan = (barcode) => {
    const timestamp = new Date().toLocaleTimeString();
    setScanHistory((prev) => [
      `[${timestamp}] Barcode ${barcode} validated and acknowledged`,
      ...prev.slice(0, 7),
    ]);
  };

  const handleSimulateLoad = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 1200);
  };

  const toggleSelectRow = (sku) => {
    setSelectedRows((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }));
  };

  return (
    <div className="app-layout">
      {/* Persistent Enterprise Sidebar Navigation */}
      <Sidebar activeId={activeNav} onSelect={setActiveNav} />

      {/* Main View Area */}
      <div className="app-main">
        {/* Command Center TopBar Header */}
        <Header
          onBarcodeScan={handleScan}
          onNewOperation={() => setIsModalOpen(true)}
        />

        {/* Scrollable Content Workspace */}
        <main className="app-content">
          {/* Breadcrumb Hierarchy */}
          <Breadcrumb
            items={[
              { label: 'StockSense' },
              { label: 'Design System' },
              { label: 'Interactive Component Library' },
            ]}
          />

          {/* Hero Header */}
          <div className="page-hero">
            <div>
              <h1 className="page-hero__title">
                StockSense Design Language System (DLS)
              </h1>
              <p className="page-hero__subtitle">
                Modular, portable enterprise React components for high-density
                inventory, logistics, and supply chain control.
              </p>
            </div>
            <div className="demo-box">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ScanBarcode size={16} />}
                onClick={() => setIsDrawerOpen(true)}
              >
                Open Barcode Drawer
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Create Stock Record
              </Button>
            </div>
          </div>

          {/* High-Impact KPI Telemetry Cards */}
          <div className="grid-cols-4">
            <StatCard
              title="Active Inventory SKUs"
              value="1,842"
              change="+8.4%"
              trend="up"
              caption="vs. prior month"
              icon={<Package size={18} />}
              iconVariant="primary"
            />
            <StatCard
              title="Incoming Receipts"
              value="34"
              change="4 awaiting check"
              trend="up"
              icon={<ArrowDownLeft size={18} />}
              iconVariant="warning"
            />
            <StatCard
              title="Outbound Delivery"
              value="118"
              change="92% fulfilled"
              trend="up"
              icon={<ArrowUpRight size={18} />}
              iconVariant="primary"
            />
            <StatCard
              title="Depleted / Stockout"
              value="3"
              change="2 items reordered"
              trend="down"
              icon={<AlertTriangle size={18} />}
              iconVariant="danger"
            />
          </div>

          {/* Alert Notification */}
          <Alert
            variant="info"
            title="Design Language System Ready for Backend Integration"
          >
            All components are modular, styled with strict design tokens, and
            support bidirectional telemetry, barcode scanning, and tabular
            numeral alignment.
          </Alert>

          {/* Tab Navigation for Interactive DLS Explorer */}
          <Tabs
            tabs={[
              { id: 'table', label: 'Data Table & Ledger', count: filteredItems.length },
              { id: 'inputs', label: 'Inputs & Barcode Scanner' },
              { id: 'buttons', label: 'Buttons & Action Controls' },
              { id: 'badges', label: 'Status Badges & Chips' },
              { id: 'tokens', label: 'Design Tokens & Colors' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* TAB 1: Data Table & Ledger */}
          {activeTab === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Table Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ width: '320px' }}>
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU, item name, barcode..."
                  />
                </div>
                <div className="demo-box">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileSpreadsheet size={15} />}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Printer size={15} />}
                  >
                    Print Barcodes
                  </Button>
                </div>
              </div>

              {/* Enterprise Data Grid */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader style={{ width: 40 }}>
                        <Checkbox />
                      </TableHeader>
                      <TableHeader>SKU Identifier</TableHeader>
                      <TableHeader>Barcode</TableHeader>
                      <TableHeader>Item Description</TableHeader>
                      <TableHeader>Location</TableHeader>
                      <TableHeader align="right">On Hand</TableHeader>
                      <TableHeader align="right">Available</TableHeader>
                      <TableHeader align="right">Unit Cost</TableHeader>
                      <TableHeader align="center">Status</TableHeader>
                      <TableHeader align="center">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.sku}
                        isSelected={!!selectedRows[item.sku]}
                      >
                        <TableCell>
                          <Checkbox
                            checked={!!selectedRows[item.sku]}
                            onChange={() => toggleSelectRow(item.sku)}
                          />
                        </TableCell>
                        <TableCell isTabular>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--ss-color-primary)',
                            }}
                          >
                            {item.sku}
                          </span>
                        </TableCell>
                        <TableCell isTabular>
                          <code className="ss-monospace" style={{ fontSize: 12 }}>
                            {item.barcode}
                          </code>
                        </TableCell>
                        <TableCell style={{ fontWeight: 500 }}>
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              fontSize: 12,
                              color: '#475569',
                            }}
                          >
                            {item.location}
                          </span>
                        </TableCell>
                        <TableCell align="right" isTabular>
                          <strong>{item.onHand}</strong>
                        </TableCell>
                        <TableCell align="right" isTabular>
                          {item.available}
                        </TableCell>
                        <TableCell align="right" isTabular>
                          {item.unitCost}
                        </TableCell>
                        <TableCell align="center">
                          <Badge status={item.status} showDot>
                            {item.statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell align="center">
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Button
                              variant="icon"
                              size="sm"
                              title="Edit item"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="icon"
                              size="sm"
                              title="Print label"
                            >
                              <Printer size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={1}
                  totalPages={1}
                  totalItems={filteredItems.length}
                  itemsPerPage={10}
                />
              </TableContainer>
            </div>
          )}

          {/* TAB 2: Inputs & Barcode Scanner */}
          {activeTab === 'inputs' && (
            <div className="grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Industrial Barcode Scanner Input</CardTitle>
                  <CardDescription>
                    Listens for hardware laser scans and Enter keystrokes.
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <BarcodeScannerInput
                    onScan={handleScan}
                    placeholder="Scan test barcode (type & press Enter)..."
                    autoFocus
                  />
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Recent Scanner Stream
                    </span>
                    <div className="scan-log" style={{ marginTop: 6 }}>
                      {scanHistory.map((log, idx) => (
                        <div key={idx}>{log}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Standard Form Fields</CardTitle>
                  <CardDescription>
                    4px corner radii, active blue focus rings, helper hints.
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <TextInput
                    label="Item Serial Number"
                    placeholder="e.g. SN-99482-B"
                    hint="Alphanumeric unique identifier"
                    required
                  />
                  <Select
                    label="Storage Zone / Bay"
                    options={[
                      { value: 'a1', label: 'Zone A - Heavy Machinery Bay 01' },
                      { value: 'b2', label: 'Zone B - Electronics Clean Room 02' },
                      { value: 'c3', label: 'Zone C - General Pallet Staging' },
                    ]}
                  />
                  <Checkbox label="Enforce dual-person barcode signoff" defaultChecked />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Buttons & Actions */}
          {activeTab === 'buttons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Button Hierarchy & Variants</CardTitle>
                  <CardDescription>
                    Calibrated according to DESIGN.md component guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      Semantic Actions
                    </p>
                    <div className="demo-box">
                      <Button variant="primary">Primary Action</Button>
                      <Button variant="secondary">Secondary Outline</Button>
                      <Button variant="outline">Bordered Highlight</Button>
                      <Button variant="destructive">Destructive Scrap</Button>
                      <Button variant="ghost">Subtle Ghost</Button>
                      <Button
                        variant="primary"
                        isLoading={btnLoading}
                        onClick={handleSimulateLoad}
                      >
                        {btnLoading ? 'Processing...' : 'Click for Loading State'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      Sizes & Icon Configurations
                    </p>
                    <div className="demo-box">
                      <Button variant="primary" size="sm">Small (28px)</Button>
                      <Button variant="primary" size="md">Medium (36px)</Button>
                      <Button variant="primary" size="lg">Large (42px)</Button>
                      <Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
                        With Left Icon
                      </Button>
                      <Button variant="secondary" size="md" rightIcon={<ExternalLink size={15} />}>
                        With Right Icon
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      32x32px Square Table Action Icons
                    </p>
                    <div className="demo-box">
                      <Button variant="icon" bordered title="Edit">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="icon" bordered title="Print">
                        <Printer size={16} />
                      </Button>
                      <Button variant="icon" bordered title="Refresh">
                        <RefreshCw size={16} />
                      </Button>
                      <Button variant="icon" bordered title="Delete">
                        <Trash2 size={16} color="#EF4444" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: Status Badges & Chips */}
          {activeTab === 'badges' && (
            <Card>
              <CardHeader>
                <CardTitle>Dual-Tone Status Chips & Telemetry Pills</CardTitle>
                <CardDescription>
                  Full rounded pills with strict color encoding and dot indicators.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Standard Statuses
                  </p>
                  <div className="demo-box">
                    <Badge status="success" showDot>In Stock / Confirmed</Badge>
                    <Badge status="warning" showDot>Low Stock / Pending</Badge>
                    <Badge status="danger" showDot>Stockout / Scrapped</Badge>
                    <Badge status="info" showDot>Draft / In Transit</Badge>
                    <Badge status="neutral" showDot>Archived</Badge>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Numerical Count Pills
                  </p>
                  <div className="demo-box">
                    <Badge status="success" isCount>+24 Received</Badge>
                    <Badge status="warning" isCount>4 Pending QA</Badge>
                    <Badge status="danger" isCount>-12 Deficit</Badge>
                    <Badge status="info" isCount>18 Assigned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: Design Tokens & Colors */}
          {activeTab === 'tokens' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Core Design Palette (DESIGN.md Tokens)</CardTitle>
                  <CardDescription>
                    Curated HSL/Hex palette engineered for industrial logistics clarity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="color-grid">
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#2563EB' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Primary Blue</div>
                        <div className="color-swatch__hex">#2563EB</div>
                      </div>
                    </div>
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#0F172A' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Deep Navy</div>
                        <div className="color-swatch__hex">#0F172A</div>
                      </div>
                    </div>
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#10B981' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Success Stock</div>
                        <div className="color-swatch__hex">#10B981</div>
                      </div>
                    </div>
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#F59E0B' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Warning Stock</div>
                        <div className="color-swatch__hex">#F59E0B</div>
                      </div>
                    </div>
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#EF4444' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Critical Red</div>
                        <div className="color-swatch__hex">#EF4444</div>
                      </div>
                    </div>
                    <div className="color-swatch">
                      <div className="color-swatch__box" style={{ background: '#F8FAFC' }} />
                      <div className="color-swatch__info">
                        <div className="color-swatch__name">Surface Base</div>
                        <div className="color-swatch__hex">#F8FAFC</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logo Presentation Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Logo Component</CardTitle>
                  <CardDescription>
                    Directly rendered from reference/stocksense_logo/code.html
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <Logo size="lg" variant="full" />
                  </div>
                  <div style={{ padding: 16, background: '#0F172A', borderRadius: 8 }}>
                    <Logo size="lg" variant="full" theme="dark" />
                  </div>
                  <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <Logo size="md" variant="mark" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modal Dialog Demo (Level 3 Elevation) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Inventory Transaction"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                handleScan('MANUAL-TX-' + Math.floor(Math.random() * 10000));
              }}
            >
              Confirm Transaction
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextInput label="SKU Identifier" placeholder="e.g. SKU-01044" required />
          <TextInput label="Initial Quantity" type="number" placeholder="100" required />
          <Select
            label="Transaction Type"
            options={[
              { value: 'receipt', label: 'Incoming Receipt (Vendor)' },
              { value: 'transfer', label: 'Internal Transfer (Bin to Bin)' },
              { value: 'delivery', label: 'Outbound Delivery (Customer)' },
              { value: 'adjustment', label: 'Stock Adjustment (Audit Count)' },
            ]}
          />
        </div>
      </Modal>

      {/* Slide-out Drawer Demo */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="High-Speed Barcode Batch Verification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
              Complete Batch
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert variant="warning">
            Batch mode active. Scanned items are immediately allocated to WH01-Staging.
          </Alert>
          <BarcodeScannerInput
            onScan={handleScan}
            placeholder="Continuous scanner feed..."
            autoFocus
          />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Verification Stream:
            </span>
            <div className="scan-log" style={{ marginTop: 8 }}>
              {scanHistory.map((item, idx) => (
                <div key={idx}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default App;
