# Product Requirements Document (PRD)
## RizQ - Sembako Delivery Assignment Dashboard

**Version:** 1.0  
**Date:** January 10, 2025  
**Status:** Draft  
**Author:** Product Team

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [User Personas & Use Cases](#2-user-personas--use-cases)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [User Interface & Design](#6-user-interface--design)
7. [User Flows](#7-user-flows)
8. [State Machine & Business Logic](#8-state-machine--business-logic)
9. [API Specifications](#9-api-specifications)
10. [Data Models](#10-data-models)
11. [Development Phases](#11-development-phases)
12. [Success Metrics & KPIs](#12-success-metrics--kpis)
13. [Risks & Mitigation](#13-risks--mitigation)
14. [Dependencies & Assumptions](#14-dependencies--assumptions)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

**RizQ** adalah dashboard penugasan pengantaran paket sembako yang dirancang untuk mengoptimalkan proses distribusi dengan menggunakan algoritma clustering dan routing yang intelligent.

**Problem Statement:**

Saat ini, sistem assignment relawan pengantar sembako masih dilakukan secara manual dengan clustering sederhana berdasarkan kota administratif (misal: semua paket Jakarta Selatan dikelompokkan bersama). Pendekatan ini menghasilkan:

- **Rute yang tidak optimal** - Mengabaikan jarak geografis sebenarnya
- **Pemborosan sumber daya** - Waktu, bahan bakar, dan tenaga
- **Clustering tidak efisien** - Tidak mempertimbangkan kapasitas pengantar
- **Ketidakefisienan perbatasan** - Dua titik berbeda kota bisa lebih dekat daripada dua titik dalam satu kota yang sama

**Proposed Solution:**

RizQ menggunakan algoritma Capacitated Vehicle Routing Problem (CVRP) dengan Google OR-Tools dan Google Routes API untuk menghasilkan:

- Clustering optimal berdasarkan jarak geografis aktual
- Pertimbangan kapasitas maksimal pengantar
- Optimasi rute dengan Traveling Salesman Problem (TSP)
- Flexibility untuk manual override oleh admin
- Real-time traffic consideration melalui Google Routes API

### 1.2 Goals & Objectives

**Business Goals:**
- Mengurangi waktu perencanaan rute dari manual (±2 jam) menjadi otomatis (±5-10 menit)
- Mengoptimalkan jarak tempuh total untuk menghemat biaya operasional (target: >15%)
- Meningkatkan efisiensi distribusi sembako
- Menyediakan tracking dan audit trail status pengantaran
- Meningkatkan kepuasan pengantar dengan rute yang lebih efisien

**User Goals (Admin):**
- Dapat membuat assignment dengan cepat dan mudah
- Memiliki kontrol penuh dengan opsi manual override
- Dapat mengelola data penerima dan pengantar dengan efisien
- Dapat dengan mudah mengirim informasi kepada pengantar via WhatsApp

**Success Metrics:**
- Pengurangan waktu planning: >85% (dari 2 jam → 10 menit)
- Pengurangan jarak tempuh total: >15%
- User adoption rate: >90% admin menggunakan sistem
- Assignment accuracy: <5% perlu manual adjustment
- System uptime: >99.5%
- User satisfaction score: >4.5/5.0

### 1.3 Scope

**In Scope (Phase 1 - MVP):**

✅ **Core Features:**
- CRUD Penerima dengan status management (Unassigned, Assigned, Delivery, Done, Return)
- CRUD Pengantar
- CRUD Assignment dengan 2 mode (Manual & Rekomendasi/CVRP)
- Multi-step assignment creation journey (4 steps)
- Route optimization:
  - Manual mode: TSP via Google Routes API
  - Rekomendasi mode: CVRP via OR-Tools + Google Routes API
- Google Maps visualization dengan interactive markers
- Status tracking workflow dengan state machine
- WhatsApp integration untuk pengiriman data penerima
- Admin authentication & authorization (username/password)
- Regional data management (Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan)

✅ **UI/UX Features:**
- Responsive tables dengan search, filter, sorting, pagination
- Interactive map-table synchronization
- Drag & drop untuk reassignment
- Color-coded status pills
- Real-time preview sebelum save

**Out of Scope (Phase 1):**

❌ **Future Features:**
- Mobile app untuk driver
- Real-time GPS tracking
- Multi-depot/warehouse support
- Driver rating/feedback system
- Automated push notifications
- Payment/invoice management
- Analytics dashboard dengan charts
- Export ke format lain (Excel, PDF reports)
- Batch operations (bulk import/export)
- Multi-language support
- Driver self-service portal

**Future Considerations (Phase 2+):**
- Driver mobile app dengan turn-by-turn navigation
- Real-time location tracking dan ETA updates
- Push notifications untuk status changes
- Advanced analytics dan reporting
- Time window constraints untuk delivery
- Multi-warehouse/depot optimization
- Route history dan performance analytics
- Integration dengan sistem inventory

---

## 2. User Personas & Use Cases

### 2.1 Primary User: Admin/Dispatcher

**Profile:**
- **Name:** Admin Distribusi
- **Role:** Koordinator distribusi sembako / Admin operasional
- **Age:** 25-50 tahun
- **Tech Savviness:** Medium (familiar dengan aplikasi web modern, Google Maps)
- **Daily Usage:** 1-3 kali per hari untuk membuat assignment baru
- **Work Environment:** Kantor/warehouse dengan desktop/laptop
- **Team Size:** Mengelola 5-20 pengantar per shift

**Pain Points:**
- ⚠️ Planning manual memakan waktu 1.5-2 jam per session
- ⚠️ Sering terjadi kesalahan clustering yang tidak efisien
- ⚠️ Sulit track status pengantaran
- ⚠️ Koordinasi dengan banyak pengantar via WhatsApp sangat manual
- ⚠️ Tidak ada history/audit trail untuk accountability
- ⚠️ Rute yang dihasilkan manual sering jauh dari optimal

**Goals:**
- ✅ Menyelesaikan assignment creation dalam <10 menit
- ✅ Mendapatkan rute yang optimal secara otomatis
- ✅ Dapat dengan mudah adjust assignment jika ada perubahan
- ✅ Track status setiap penerima dengan mudah
- ✅ Kirim informasi ke pengantar dengan 1 klik

**Technical Skills:**
- Familiar dengan web applications
- Comfortable dengan Google Maps
- Basic understanding of optimization concepts
- Can follow multi-step processes

### 2.2 User Stories

#### Epic 1: Recipient Management
```
US-01: Sebagai Admin, saya ingin menambah penerima baru dengan data lengkap 
       (termasuk koordinat maps), agar penerima dapat diikutkan dalam assignment.
       
US-02: Sebagai Admin, saya ingin melihat daftar semua penerima dengan filter 
       dan search, agar saya dapat menemukan penerima dengan cepat.
       
US-03: Sebagai Admin, saya ingin melihat detail penerima beserta history 
       status changes, agar saya dapat audit trail lengkap.
       
US-04: Sebagai Admin, saya ingin mengubah data penerima, agar data tetap 
       up-to-date.
       
US-05: Sebagai Admin, saya ingin menghapus penerima (single atau bulk), 
       agar data tetap bersih.
```

#### Epic 2: Courier Management
```
US-06: Sebagai Admin, saya ingin menambah pengantar baru, agar mereka dapat 
       menerima assignment.
       
US-07: Sebagai Admin, saya ingin melihat daftar semua pengantar, agar saya 
       tahu siapa yang available.
       
US-08: Sebagai Admin, saya ingin melihat detail pengantar beserta assignment 
       history, agar saya tahu workload mereka.
       
US-09: Sebagai Admin, saya ingin mengubah data pengantar, agar data tetap 
       up-to-date.
```

#### Epic 3: Assignment Creation (Manual Mode)
```
US-10: Sebagai Admin, saya ingin memilih penerima secara manual dan 
       mengelompokkan mereka, agar saya punya kontrol penuh atas assignment.
       
US-11: Sebagai Admin, saya ingin sistem mengoptimasi urutan kunjungan dalam 
       setiap grup (TSP), agar rute tetap efisien meski manual clustering.
       
US-12: Sebagai Admin, saya ingin assign pengantar ke setiap grup, agar setiap 
       assignment punya responsible person.
```

#### Epic 4: Assignment Creation (Rekomendasi Mode)
```
US-13: Sebagai Admin, saya ingin sistem memberikan rekomendasi clustering 
       optimal berdasarkan kapasitas, agar saya tidak perlu berpikir sendiri.
       
US-14: Sebagai Admin, saya ingin bisa override rekomendasi dengan drag & drop, 
       agar saya tetap punya flexibility jika ada kondisi khusus.
       
US-15: Sebagai Admin, saya ingin melihat preview assignment sebelum save, 
       agar saya bisa validasi sebelum commit.
```

#### Epic 5: Assignment Tracking
```
US-16: Sebagai Admin, saya ingin melihat daftar semua assignment dengan filter, 
       agar saya dapat monitor semua ongoing deliveries.
       
US-17: Sebagai Admin, saya ingin update status penerima (Kirim, Tiba, Return), 
       agar status tracking selalu akurat.
       
US-18: Sebagai Admin, saya ingin kirim data penerima ke WhatsApp pengantar 
       dengan 1 klik, agar koordinasi lebih cepat.
       
US-19: Sebagai Admin, saya ingin edit assignment yang sudah dibuat (add/remove 
       recipients), agar bisa handle changes on the fly.
```

#### Epic 6: Visualization
```
US-20: Sebagai Admin, saya ingin melihat semua penerima di peta, agar saya 
       dapat visualize distribusi geografis.
       
US-21: Sebagai Admin, saya ingin interaksi map-table yang sinkron (hover/click), 
       agar saya dapat dengan mudah identify penerima.
       
US-22: Sebagai Admin, saya ingin melihat rute optimal di peta dengan polyline, 
       agar saya dapat validasi visualisasi rute.
```

### 2.3 Use Case Scenarios

#### Scenario 1: Daily Route Planning dengan Mode Rekomendasi
```
Precondition: 
- 50 penerima dengan status Unassigned ada di database
- 5 pengantar available
- Kapasitas per pengantar: 12 paket

Flow:
1. Admin login ke dashboard
2. Admin navigasi ke "Buat Assignment"
3. Admin melihat peta dengan 50 markers penerima
4. Admin pilih "Mode Rekomendasi"
5. Admin select all 50 penerima via checkbox
6. Admin input kapasitas: 12 paket
7. Admin klik "Selanjutnya"
8. Admin pilih 5 pengantar via checkbox
9. Admin klik "Selanjutnya"
10. Sistem menjalankan CVRP algorithm (30 detik)
11. Sistem menampilkan preview:
    - 5 assignment dengan clustering optimal
    - Setiap assignment punya 10 penerima (avg)
    - Map menampilkan 5 polyline berwarna berbeda
    - Total distance: 85 km (vs. 110 km manual clustering)
12. Admin review dan satisfied dengan hasil
13. Admin klik "Buat Assignment"
14. Sistem save ke database
15. Status 50 penerima berubah menjadi "Assigned"
16. Admin redirect ke list assignment

Result: Assignment dibuat dalam 5 menit dengan optimasi 23% distance saving
```

#### Scenario 2: Manual Override karena Kondisi Khusus
```
Precondition:
- Assignment sudah dibuat dengan mode rekomendasi
- Ada request khusus: Penerima A harus dikirim oleh Pengantar X

Flow:
1. Admin di step "Preview Assignment"
2. Admin lihat Penerima A di Assignment 2 (Pengantar Y)
3. Admin drag Penerima A dari tabel Assignment 2
4. Admin drop ke tabel Assignment 1 (Pengantar X)
5. Warna row Penerima A berubah mengikuti Assignment 1
6. Marker Penerima A di map juga berubah warna
7. Sistem re-calculate total distance Assignment 1 dan 2
8. Admin satisfied dengan perubahan
9. Admin klik "Buat Assignment"
10. Sistem save dengan adjustment

Result: Flexibility terjaga tanpa mengorbankan keseluruhan optimasi
```

#### Scenario 3: Emergency Re-routing (Pengantar Tidak Available)
```
Precondition:
- Assignment 3 sudah dibuat untuk Pengantar C
- Pengantar C tiba-tiba sakit, tidak bisa deliver
- Assignment 3 punya 8 penerima

Flow:
1. Admin buka Assignment 3 detail page
2. Admin klik "Mode Ubah"
3. Admin klik tombol hapus pada 8 rows
4. 8 penerima masuk ke "Removed Recipients" container
5. Admin batal hapus assignment (untuk preserve history)
6. Admin klik "Simpan Perubahan" (Assignment 3 sekarang empty)
7. Admin buka Assignment 1 detail page
8. Admin klik "Mode Ubah"
9. Admin add 4 penerima dari dropdown (status Unassigned)
10. Admin simpan perubahan
11. Ulangi untuk Assignment 2 (add 4 penerima lagi)
12. Status 8 penerima: Unassigned → Assigned (ke assignment baru)

Result: Emergency handled dengan redistribute penerima
```

#### Scenario 4: Tracking Delivery Progress
```
Precondition:
- Assignment 1 punya 10 penerima, semua status "Assigned"
- Pengantar mulai delivery

Flow:
1. Pengantar konfirmasi via phone: sudah mulai pengantaran
2. Admin buka Assignment 1 detail page
3. Admin klik tombol "Kirim" (bulk button)
4. Status 10 penerima berubah: Assigned → Delivery
5. Pengantar konfirmasi: sudah sampai Penerima #1
6. Admin klik tombol "Tiba di Penerima" di row #1
7. Status Penerima #1: Delivery → Done
8. Pengantar konfirmasi: Penerima #2 tidak ada di tempat
9. Admin klik tombol "Dikembalikan ke Gudang" di row #2
10. Status Penerima #2: Delivery → Return
11. Admin dapat monitor progress real-time

Result: Status tracking akurat dengan granular control
```

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 Login System
- **FR-AUTH-001:** Sistem harus menyediakan halaman login dengan username dan password
- **FR-AUTH-002:** Password harus di-hash menggunakan bcrypt atau argon2
- **FR-AUTH-003:** Session management menggunakan JWT token
- **FR-AUTH-004:** Token expiry: 8 jam (auto-logout setelah idle)
- **FR-AUTH-005:** Login failed 5x dalam 15 menit → account locked 30 menit
- **FR-AUTH-006:** Redirect ke dashboard setelah successful login
- **FR-AUTH-007:** Redirect ke login page jika access protected route tanpa auth

#### 3.1.2 Authorization
- **FR-AUTH-008:** Hanya user dengan role "Admin" yang dapat akses sistem
- **FR-AUTH-009:** (Future) Support multiple roles (Admin, Supervisor, Viewer)

---

### 3.2 CRUD Penerima (Recipients)

#### 3.2.1 Read All Recipients
**FR-RCP-001: Data Table Requirements**
- Columns: No (auto-number), Nama, Nomor Telpon, Status (pill), Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan, Alamat, Jumlah Paket
- Click row → navigate to detail page
- Checkbox di setiap row untuk bulk selection

**FR-RCP-002: Search & Filter**
- Global search query yang berlaku pada semua fields
- Filter dropdown: Status, Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan
- Filter wilayah menggunakan continuation token untuk pagination
- Filter wilayah tidak dependent (show all possible values)

**FR-RCP-003: Sorting**
- Setiap column dapat di-sort ascending/descending
- Default sort: created_at DESC

**FR-RCP-004: Pagination**
- Options: 10, 30, 50, 100 items per page
- Show total count
- Show current page / total pages

**FR-RCP-005: Bulk Actions**
- Tombol "Hapus" muncul saat ada checkbox terpilih
- Konfirmasi dialog sebelum bulk delete
- Soft delete (data tidak benar-benar terhapus, hanya marked)

**FR-RCP-006: Create Button**
- Tombol "Buat" di top-right untuk navigate ke create form

**FR-RCP-007: Status Pills**
- Unassigned: Abu-abu (#6B7280)
- Assigned: Kuning (#F59E0B)
- Delivery: Biru (#3B82F6)
- Done: Hijau (#10B981)
- Return: Merah (#EF4444)

#### 3.2.2 Read Detail Recipient
**FR-RCP-008: Detail Display**
- Show all recipient fields
- Google Maps dengan marker di koordinat penerima
- Map: zoom level 15, marker color sesuai status

**FR-RCP-009: Action Buttons**
- Tombol "Ubah" → navigate to edit form
- Tombol "Hapus" → konfirmasi dialog → soft delete → redirect ke list

**FR-RCP-010: Status History Table**
- Columns: Status (pill), Tanggal & Waktu Perubahan
- Sort: timestamp DESC (newest first)
- Show all status transitions

#### 3.2.3 Create Recipient
**FR-RCP-011: Form Fields**
- Nama: required, text input, max 100 chars
- Nomor Telpon: required, text input, format validation (Indonesian phone)
- Alamat: required, textarea, max 500 chars
- Provinsi: required, searchable dropdown
- Kabupaten/Kota: required, dependent dropdown (filtered by Provinsi)
- Kecamatan: required, dependent dropdown (filtered by Kabupaten/Kota)
- Kelurahan: required, dependent dropdown (filtered by Kecamatan)
- Jumlah Paket: required, number input, min 1, max 999
- Koordinat: required, Google Maps picker atau manual input (lat, lng)

**FR-RCP-012: Regional Data Dependency**
- Pilih Provinsi → populate Kabupaten/Kota dropdown
- Pilih Kabupaten/Kota → populate Kecamatan dropdown
- Pilih Kecamatan → populate Kelurahan dropdown
- Reset dependent fields saat parent berubah

**FR-RCP-013: Koordinat Input Methods**
- Option 1: Click pada Google Maps
- Option 2: Manual input latitude, longitude
- Option 3: Geocode dari alamat lengkap (Google Geocoding API)
- Validation: koordinat harus dalam Indonesia bounds

**FR-RCP-014: Form Validation**
- Client-side validation untuk UX
- Server-side validation untuk security
- Show error messages below each field
- Disable submit jika ada validation errors

**FR-RCP-015: Submit Behavior**
- Initial status: "Unassigned"
- Success → redirect ke detail page dengan toast success
- Error → stay di form, show error messages

#### 3.2.4 Update Recipient
**FR-RCP-016: Form Pre-population**
- Form fields terisi dengan data existing
- Dependent dropdowns terisi sesuai existing selections

**FR-RCP-017: Update Restrictions**
- Cannot update status directly (only via assignment workflow)
- Cannot update if status is "Delivery" atau "Done"
- Warning jika recipient sudah assigned

**FR-RCP-018: Submit Behavior**
- Success → redirect ke detail page dengan toast
- Track changes untuk audit log

---

### 3.3 CRUD Pengantar (Couriers)

#### 3.3.1 Read All Couriers
**FR-CRR-001: Data Table**
- Columns: No, Nama, Nomor Telpon
- Click row → navigate to detail page
- Checkbox untuk bulk selection

**FR-CRR-002: Search & Filter**
- Global search pada semua fields
- No additional filters needed

**FR-CRR-003: Sorting**
- Setiap column sortable ASC/DESC
- Default: created_at DESC

**FR-CRR-004: Pagination**
- Options: 10, 30, 50, 100

**FR-CRR-005: Bulk Delete**
- Tombol "Hapus" muncul saat ada selection
- Konfirmasi dialog
- Cannot delete jika pengantar punya active assignments

#### 3.3.2 Create Courier
**FR-CRR-006: Form Fields**
- Nama: required, text, max 100 chars
- Nomor Telpon: required, format validation

**FR-CRR-007: Validation**
- Phone number must be unique
- Indonesian phone format: 08xx-xxxx-xxxx or +62xxx

#### 3.3.3 Update Courier
**FR-CRR-008: Form Pre-population**
- Load existing data

**FR-CRR-009: Update Restrictions**
- Cannot update if pengantar sedang dalam active delivery (has assignments with status Delivery)

#### 3.3.4 Read Detail Courier
**FR-CRR-010: Display**
- Show courier details
- Table of assigned recipients

**FR-CRR-011: Assigned Recipients Table**
- Columns: No, Nama Penerima, Provinsi, Kabupaten/Kota, Nama Assignment
- Search, sort, pagination (10/30/50/100)
- Click row → navigate to recipient detail

---

### 3.4 CRUD Assignment

#### 3.4.1 Create Assignment - Step 1: View Recipients & Choose Mode

**FR-ASG-001: Recipient Display Modes**
- Mode "All": Single table, setiap recipient punya unique color marker
- Mode "Kabupaten/Kota": Multiple tables grouped by city, table color = marker color

**FR-ASG-002: Recipient Table (Mode All)**
- Columns: No, Nama, Nomor Telpon, Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan, Alamat, Legenda Warna, Status, Jumlah Paket
- Filter: Only show Unassigned recipients
- Checkbox untuk selection

**FR-ASG-003: Recipient Tables (Mode Kabupaten/Kota)**
- Separate table per city
- Each table punya warna background unik
- Columns: Same as Mode All, minus Legenda Warna column
- Warna table = warna marker

**FR-ASG-004: Google Maps Display**
- Show all Unassigned recipients as markers
- Marker color:
  - Mode All: unique color per recipient
  - Mode Kabupaten/Kota: same color untuk recipients dalam city yang sama

**FR-ASG-005: Map-Table Interaction**
- Hover row → highlight marker (full opacity, others 30% opacity)
- Hover row → row background color = marker color
- Hover marker → highlight marker, show tooltip (Nama, Alamat)
- Click marker → scroll page to corresponding row, highlight row
- Hover lain → unhighlight previous

**FR-ASG-006: Assignment Mode Selection**
- Toggle: "Manual" vs "Rekomendasi"
- Mode Manual:
  - Checkbox untuk select recipients
  - Tombol "Buat Assignment" untuk create group
  - Can create multiple groups
  - Groups displayed as pills: "Assignment 1", "Assignment 2", etc.
  - Tombol "Selanjutnya" untuk proceed
- Mode Rekomendasi:
  - Checkbox untuk select recipients
  - Input field "Kapasitas Maksimal per Pengantar" (number, required, min 1)
  - Tombol "Selanjutnya" untuk proceed

#### 3.4.2 Create Assignment - Step 2: Select Couriers

**FR-ASG-007: Courier Selection Table**
- Show all couriers
- Columns: No, Nama, Nomor Telpon
- Checkbox untuk selection
- Must select at least 1 courier

**FR-ASG-008: Navigation**
- Tombol "Selanjutnya" → proceed to Step 3 (disabled jika no courier selected)
- Tombol "Kembali" → back to Step 1 (preserve selections)

#### 3.4.3 Create Assignment - Step 3: Preview & Adjust

**FR-ASG-009: Algorithm Execution**
- Mode Manual:
  - Input: Depot location, manual assignment groups
  - Algorithm: TSP via Google Routes API
  - Process: Optimize sequence untuk each group
  - Output: Optimized route per assignment
- Mode Rekomendasi:
  - Input: Depot location, all selected recipients, package counts, capacity per courier
  - Algorithm: CVRP via Google OR-Tools
  - Process: Create clusters + optimize routes
  - Output: Optimal assignments + routes
  - Constraint: No return to depot (open VRP)
  - Computation time target: <60 seconds untuk 100 recipients

**FR-ASG-010: Courier-Assignment Auto-Distribution**
- Rule: Minimal 1 assignment per courier
- Case 1: Couriers < Assignments
  - Distribute evenly (round-robin)
  - Example: 3 couriers, 7 assignments → Courier 1 gets 3, Courier 2 gets 2, Courier 3 gets 2
- Case 2: Couriers > Assignments
  - Each assignment gets 1 courier
  - Unassigned couriers → "Available Couriers" container (can drag to assignments)
- Case 3: Couriers = Assignments
  - 1-to-1 mapping

**FR-ASG-011: Preview Display**
- N tables (1 per assignment)
- Above each table: Courier info card (Nama, Nomor Telpon), Total jarak tempuh
- Table has unique background color = marker color pada map
- Columns: No, Nama Penerima, Nomor Telpon, Provinsi, Kabupaten/Kota, Alamat, Jumlah Paket, Actions (Delete button)

**FR-ASG-012: Assignment Naming**
- Default name: "Assignment 1", "Assignment 2", etc.
- Editable inline (click to edit)
- Validation: unique names, max 50 chars

**FR-ASG-013: Map Display**
- Show all recipients dengan marker color = assignment color
- Show route polylines untuk each assignment

**FR-ASG-014: Drag & Drop Functionality**
- Can drag recipient row from one table to another
- When dropped:
  - Row color changes to destination table color
  - Marker color changes on map
  - Update package count untuk both tables
  - Re-calculate total distance (if applicable)
- Cannot drag jika melebihi capacity (show warning)

**FR-ASG-015: Delete Recipient from Assignment**
- Delete button di each row
- Click → move to "Removed Recipients" container
- Container shows removed recipients (can drag back)

**FR-ASG-016: Drag Courier Between Assignments**
- Courier cards di atas table dapat di-drag
- Can swap couriers between assignments
- Can drag from "Available Couriers" container

**FR-ASG-017: Map-Table Sync (Same as Step 1)**
- Hover, click interactions tetap sama
- Colors sesuai assignment

**FR-ASG-018: Data Persistence**
- Data NOT saved to database yet
- All changes kept in memory/state

**FR-ASG-019: Submit**
- Tombol "Buat Assignment" → validate → save to database
  - Create assignment records
  - Update recipient status: Unassigned → Assigned
  - Save route data (sequence, distances, polylines)
  - Success → redirect ke Assignment List page dengan toast
  - Error → show error message, stay on page

**FR-ASG-020: Navigation**
- Tombol "Kembali" → back to Step 2 (preserve all state)

#### 3.4.4 Read All Assignments

**FR-ASG-021: Assignment Table**
- Columns: No, Nama Assignment, Nama-nama Penerima (comma-separated, truncate jika terlalu panjang), Nama Pengantar
- Click row → navigate to detail page
- Pagination: 10/30/50/100
- Delete button di each row (with confirmation)

**FR-ASG-022: Filters**
- Search query: Nama penerima (search in comma-separated string)
- Filter dropdowns: Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan
- Filter logic: Show assignments yang punya at least 1 recipient matching filter
- Dropdown dengan continuation token pagination (banyak options)

**FR-ASG-023: Delete Assignment**
- Confirmation dialog
- On confirm:
  - Soft delete assignment
  - Update all recipient status: current status → Unassigned
  - Cannot delete jika ada recipient dengan status "Done"

#### 3.4.5 Read Detail Assignment

**FR-ASG-024: Display Components**
- Google Maps dengan markers dan polyline untuk all recipients in assignment
- Courier information card
- Recipients table

**FR-ASG-025: Recipients Table**
- Columns: No, Nama, Nomor Telpon, Provinsi, Kabupaten/Kota, Alamat, Status (pill), Jumlah Paket
- Default mode: Read-only

**FR-ASG-026: Edit Mode**
- Tombol "Mode Ubah" untuk toggle edit mode
- In edit mode:
  - Delete button appears di each row
  - Click delete → move row ke "Removed Recipients" container
  - Add row functionality:
    - Dropdown untuk select recipient (filter: status = Unassigned)
    - Dropdown searchable: Nama - Kabupaten/Kota
    - Click add → append to table
  - Tombol "Simpan Perubahan" → save changes to database
  - Tombol "Batal" → discard changes, exit edit mode

**FR-ASG-027: Status Update Buttons - Bulk Actions**
- Tombol "Kirim" (blue) → change all recipients status to Delivery
  - Only visible if ALL recipients have status = Assigned
- Tombol "Tiba di Penerima" (green) → change all recipients status to Done
  - Only visible if ALL recipients have status = Delivery
- Tombol "Dikembalikan ke Gudang" (red) → change all recipients status to Return
  - Only visible if ALL recipients have status = Delivery
- Confirmation dialog sebelum bulk action
- Update timestamp untuk status change history

**FR-ASG-028: Status Update Buttons - Individual Actions**
- Each row has individual action buttons:
  - "Kirim" button di row (if status = Assigned)
  - "Tiba di Penerima" button di row (if status = Delivery)
  - "Dikembalikan ke Gudang" button di row (if status = Delivery)
- No confirmation untuk individual action (faster workflow)
- Update timestamp untuk status change history

**FR-ASG-029: Delete Assignment Button**
- Tombol "Hapus Assignment" (destructive action)
- Confirmation dialog dengan warning
- On confirm:
  - Soft delete assignment
  - Update all recipient status → Unassigned
  - Cannot delete if any recipient status = Done
  - Redirect to assignment list dengan toast

**FR-ASG-030: WhatsApp Integration**
- Tombol "Kirim Data Penerima" di assignment detail page
- Button style: Primary blue, icon WhatsApp, text "Kirim Data Penerima"
- Position: Top action bar, sebelah tombol status update

**On Click Behavior:**

1. **Data Collection:**
   - Get courier phone number dari assignment
   - Get all recipients dalam urutan sequence (sesuai optimized route)
   - Get route polyline atau waypoints dari route_data

2. **Generate WhatsApp Deep Link:**
   - Format: `https://wa.me/{phone}?text={encoded_message}`
   - Phone format: Remove leading 0, add 62 (Indonesian country code)
   - Example: 081234567890 → 6281234567890

3. **Message Body Format:**
```
*Daftar Penerima - {nama_assignment}*

1. {nama_penerima}
📱 {nomor_telpon}
📍 {alamat}
{kelurahan}, {kecamatan}, {kabupaten_kota}, {provinsi}
🗺️ {google_maps_url_titik_penerima}

2. {nama_penerima_2}
📱 {nomor_telpon_2}
📍 {alamat_2}
{kelurahan}, {kecamatan}, {kabupaten_kota}, {provinsi}
🗺️ {google_maps_url_titik_penerima_2}

...

---
📍 *Rute Lengkap:*
{google_maps_url_rute_lengkap}

Total: {jumlah_penerima} penerima
Jarak: {total_jarak} km
Estimasi: {estimasi_waktu} menit
```

4. **URL Formats:**
   - **Individual Location:** `https://maps.google.com/?q={lat},{lng}`
   - **Complete Route with Waypoints:** 
     - `https://www.google.com/maps/dir/?api=1&origin={depot_lat},{depot_lng}&destination={last_recipient_lat},{last_recipient_lng}&waypoints={lat1},{lng1}|{lat2},{lng2}|...&travelmode=driving`
     - Alternative (simpler): `https://www.google.com/maps/dir/{depot_lat},{depot_lng}/{lat1},{lng1}/{lat2},{lng2}/.../{last_lat},{last_lng}`
   - Encode coordinates dengan 6 decimal places

5. **Message Encoding:**
   - URL encode message body
   - Encode special characters: space → %20, newline → %0A
   - Maximum message length: ~2000 characters (WhatsApp limitation)
   - If exceeded, truncate dan add "... (lihat detail di aplikasi)"

6. **Open WhatsApp:**
   - Desktop: `window.open(whatsappUrl, '_blank')`
   - Mobile: Automatically opens WhatsApp app
   - Error handling: If WhatsApp not installed, show fallback

7. **Fallback Options:**
   - If WhatsApp URL fails to open:
     - Show modal dengan message text
     - Button "Copy to Clipboard"
     - Button "Try Again"
   - If message too long:
     - Option 1: Send tanpa route URL
     - Option 2: Download as .txt file

**FR-ASG-031: Message Formatting Rules**
- Use emojis untuk better readability (📱, 📍, 🗺️)
- Bold untuk headers (*text*)
- Numbered list untuk recipients (1., 2., 3.)
- Separator line (---) sebelum route section
- Include assignment name di header
- Include summary di footer (total, distance, time)

**FR-ASG-032: Route URL Generation Logic**
```javascript
function generateRouteUrl(assignment) {
  const depot = { lat: -6.2088, lng: 106.8456 };
  const recipients = assignment.recipients.sort((a, b) => 
    a.sequence_order - b.sequence_order
  );
  
  // Method 1: Using Directions API format (preferred)
  const origin = `${depot.lat},${depot.lng}`;
  const destination = `${recipients[recipients.length - 1].location.lat},${recipients[recipients.length - 1].location.lng}`;
  const waypoints = recipients.slice(0, -1)
    .map(r => `${r.location.lat},${r.location.lng}`)
    .join('|');
  
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  
  // Method 2: Simple URL (fallback if Method 1 exceeds URL length)
  const allPoints = [depot, ...recipients.map(r => r.location)]
    .map(p => `${p.lat},${p.lng}`)
    .join('/');
  
  return `https://www.google.com/maps/dir/${allPoints}`;
}
```

**FR-ASG-033: Character Limit Handling**
- Calculate message length before encoding
- Priority order jika perlu truncate:
  1. Keep all recipient names & locations
  2. Keep individual Google Maps URLs
  3. Shorten addresses if needed
  4. Optional: Remove route URL jika masih exceeded
- Show warning to user if message truncated
- Option to split into multiple messages jika >25 recipients

**FR-ASG-034: Phone Number Validation**
- Validate courier has valid phone number
- Show error if phone number missing: "Pengantar belum memiliki nomor telepon"
- Button disabled if courier phone invalid
- Format validation: Must be Indonesian phone number

**FR-ASG-035: Loading State**
- Show loading indicator while generating message (1-2s untuk format)
- Disable button during generation
- Toast notification on success: "Membuka WhatsApp..."
- Toast notification on error: "Gagal membuka WhatsApp. Silakan coba lagi."

**FR-ASG-036: Mobile Responsiveness**
- On mobile: WhatsApp app opens directly (if installed)
- On desktop: Opens web.whatsapp.com in new tab
- Deep link format sama untuk both platforms

**Example Generated Message:**
```
*Daftar Penerima - Assignment Kebayoran*

1. Ibu Siti Aminah
📱 081234567890
📍 Jl. Sudirman No. 123, RT 01/RW 02
Senayan, Kebayoran Baru, Jakarta Selatan, DKI Jakarta
🗺️ https://maps.google.com/?q=-6.2088,106.8456

2. Pak Budi Santoso
📱 081234567891
📍 Jl. Asia Afrika No. 45
Gelora, Tanah Abang, Jakarta Pusat, DKI Jakarta
🗺️ https://maps.google.com/?q=-6.2095,106.8401

3. Ibu Ani Wijaya
📱 081234567892
📍 Jl. MH Thamrin No. 78
Menteng, Jakarta Pusat, DKI Jakarta
🗺️ https://maps.google.com/?q=-6.1952,106.8230

---
📍 *Rute Lengkap:*
https://www.google.com/maps/dir/?api=1&origin=-6.2,106.8&destination=-6.1952,106.8230&waypoints=-6.2088,106.8456|-6.2095,106.8401&travelmode=driving

Total: 3 penerima
Jarak: 8.5 km
Estimasi: 25 menit
```

**FR-ASG-031: Map Display**
- Show all recipients in assignment
- Marker colors sesuai assignment color
- Info window on marker click (Nama, Alamat, Status)
- Fit bounds to all markers
- Polyline rute

---

### 3.5 Regional Data Management

**FR-REG-001: Data Source**
- Indonesia administrative regions dari official source (BPS atau similar)
- Hierarchy: Provinsi > Kabupaten/Kota > Kecamatan > Kelurahan/Desa
- Data format: PostgreSQL tables dengan foreign keys

**FR-REG-002: API Endpoints**
- `GET /api/regions/provinces` → list all provinces
- `GET /api/regions/cities?province_id={id}` → list cities in province
- `GET /api/regions/districts?city_id={id}` → list districts in city
- `GET /api/regions/villages?district_id={id}` → list villages in district

**FR-REG-003: Pagination for Dropdown**
- Large datasets (cities, villages) use continuation token
- Return: `{items: [], next_token: string | null}`
- Search support: `?search={query}`
- Limit: 50 items per request

---

### 3.6 Status Management & State Machine

**FR-STS-001: Recipient Status Enum**
```
- Unassigned (initial state)
- Assigned
- Delivery
- Done (terminal state)
- Return
```

**FR-STS-002: State Transitions**
See detailed state machine in Section 8

**FR-STS-003: Status History**
- Track every status change
- Store: old_status, new_status, changed_by (admin_id), timestamp
- Display in recipient detail page
- Immutable audit trail

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-PERF-001: Page Load Time**
- Initial page load: <3 seconds
- Subsequent navigation: <1 second (SPA)
- Table rendering: <500ms untuk 100 rows

**NFR-PERF-002: Algorithm Performance**
- TSP optimization: <5 seconds untuk 25 waypoints
- CVRP optimization: <60 seconds untuk 100 recipients, 10 couriers
- Show progress indicator untuk long-running operations

**NFR-PERF-003: API Response Time**
- CRUD operations: <200ms (95th percentile)
- Search/filter queries: <500ms
- Google Maps API calls: <1 second

**NFR-PERF-004: Database Queries**
- Indexed fields: status, province_id, city_id, created_at
- Use query optimization (EXPLAIN ANALYZE)
- Connection pooling untuk database

**NFR-PERF-005: Map Performance**
- Render 200 markers: <2 seconds
- Marker clustering untuk >100 markers (optional)
- Lazy load polylines

### 4.2 Scalability

**NFR-SCALE-001: Data Volume**
- Support 10,000 recipients
- Support 500 couriers
- Support 1,000 active assignments simultaneously

**NFR-SCALE-002: Concurrent Users**
- Support 20 concurrent admin users
- Handle 50 requests per second

**NFR-SCALE-003: Database**
- PostgreSQL with proper indexing
- Regular backup (daily)
- Partition tables jika perlu (future)

### 4.3 Reliability

**NFR-REL-001: Uptime**
- Target: 99.5% uptime (exclude maintenance windows)
- Planned maintenance: off-peak hours, communicated 24h advance

**NFR-REL-002: Data Integrity**
- ACID transactions untuk critical operations
- Foreign key constraints
- Soft delete untuk audit trail
- Backup retention: 30 days

**NFR-REL-003: Error Handling**
- Graceful degradation (if Google Maps API fails, show table only)
- User-friendly error messages
- Error logging untuk debugging
- Retry mechanism untuk transient failures

**NFR-REL-004: Data Recovery**
- Automated daily backups
- Recovery Point Objective (RPO): 24 hours
- Recovery Time Objective (RTO): 4 hours

### 4.4 Security

**NFR-SEC-001: Authentication**
- Password hashing: bcrypt dengan salt
- Minimum password requirement: 8 chars, mixed case + numbers
- JWT token dengan expiry
- Secure cookie storage (HttpOnly, Secure flags)

**NFR-SEC-002: Authorization**
- Role-based access control (RBAC)
- All endpoints require authentication
- API rate limiting: 100 requests per minute per user

**NFR-SEC-003: Input Validation**
- Server-side validation untuk all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize outputs)
- CSRF protection

**NFR-SEC-004: Data Privacy**
- Encrypt sensitive data at rest (optional, future)
- HTTPS only (TLS 1.2+)
- Audit logging untuk sensitive operations
- GDPR compliance consideration (data retention policy)

**NFR-SEC-005: API Security**
- CORS configuration (whitelist frontend domain)
- API key rotation policy (Google APIs)
- No credentials in source code (environment variables)

### 4.5 Usability

**NFR-UX-001: Schneiderman's Eight Golden Rules**

1. **Strive for consistency**
   - Consistent button placement
   - Consistent color scheme
   - Consistent terminology
   - Consistent interaction patterns

2. **Enable frequent users to use shortcuts**
   - Keyboard shortcuts (Ctrl+S untuk save, Esc untuk cancel)
   - Bulk operations
   - Quick filters

3. **Offer informative feedback**
   - Loading states untuk all async operations
   - Toast notifications untuk success/error
   - Progress bars untuk long operations
   - Status pills dengan clear colors

4. **Design dialogs to yield closure**
   - Clear completion states
   - Redirect after successful operations
   - Confirmation messages

5. **Prevent errors**
   - Form validation sebelum submit
   - Confirmation dialogs untuk destructive actions
   - Disable buttons when action not allowed
   - Clear constraints (capacity limits)

6. **Permit easy reversal of actions**
   - Soft delete (can be restored)
   - Edit mode dengan "Batal" button
   - Drag & drop dapat di-undo
   - Back navigation preserves state

7. **Support internal locus of control**
   - Manual mode untuk full control
   - Override recommendations
   - Flexible reassignment
   - Clear cause-effect relationships

8. **Reduce short-term memory load**
   - Visual feedback (highlighted rows, markers)
   - Breadcrumbs untuk multi-step process
   - Preview before commit
   - Persistent filters

**NFR-UX-002: Responsive Design**
- Desktop primary (1920x1080, 1366x768)
- Tablet support (768px+)
- Mobile: Basic support, table → cards (optional)

**NFR-UX-003: Accessibility**
- Keyboard navigation support
- Screen reader compatible (ARIA labels)
- Color contrast ratio: WCAG AA compliant
- Focus indicators

**NFR-UX-004: Loading States**
- Skeleton screens untuk tables
- Spinners untuk buttons
- Progress bar untuk algorithms
- Disable form during submission

**NFR-UX-005: Error Messages**
- Clear, actionable error messages
- Show field-level errors di forms
- Toast notifications dengan auto-dismiss (5s)
- Error messages dalam Bahasa Indonesia

### 4.6 Maintainability

**NFR-MAIN-001: Code Quality**
- Python: PEP8 compliance (enforced by linters)
- JavaScript: ESLint + Prettier
- Type hints untuk Python (mypy)
- TypeScript untuk React (optional, recommended)

**NFR-MAIN-002: Code Principles**
- KISS (Keep It Simple, Stupid)
- DRY (Don't Repeat Yourself)
- SOLID principles
- Clean Architecture
- Dependency Injection

**NFR-MAIN-003: Documentation**
- API documentation (OpenAPI/Swagger)
- Code comments untuk complex logic
- README dengan setup instructions
- Architecture decision records (ADRs)

**NFR-MAIN-004: Testing**
- Unit tests: >80% coverage
- Integration tests untuk critical flows
- E2E tests untuk main user journeys
- API contract tests

**NFR-MAIN-005: Version Control**
- Git dengan feature branches
- Pull request workflow
- Semantic versioning
- Changelog maintenance

### 4.7 Compatibility

**NFR-COMPAT-001: Browser Support**
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE11 support

**NFR-COMPAT-002: Mobile Browser**
- Chrome Mobile (Android)
- Safari Mobile (iOS)
- Responsive layout adjustments

**NFR-COMPAT-003: Dependencies**
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- PostGIS 3.3+

---

## 5. Technical Architecture

### 5.1 Technology Stack

#### 5.1.1 Backend
- **Framework:** FastAPI 0.104+
- **Language:** Python 3.10+
- **ORM:** SQLAlchemy 2.0+
- **Database:** PostgreSQL 14+ with PostGIS 3.3+
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt or argon2
- **Validation:** Pydantic v2
- **Testing:** pytest, pytest-asyncio
- **Optimization:** Google OR-Tools
- **Maps:** google-maps-services-python

#### 5.1.2 Frontend
- **Framework:** React 18+
- **Build Tool:** Vite 5+
- **Styling:** Tailwind CSS 3+
- **UI Components:** shadcn/ui
- **Maps:** @react-google-maps/api
- **HTTP Client:** Axios
- **Icons:** lucide-react
- **Drag & Drop:** react-beautiful-dnd or @dnd-kit
- **State Management:** React Context + useState (no Redux needed for MVP)
- **Forms:** react-hook-form + zod

#### 5.1.3 Infrastructure
- **Hosting:** TBD (options: AWS, GCP, DigitalOcean, Railway)
- **Web Server:** Uvicorn (ASGI)
- **Reverse Proxy:** Nginx (optional)
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + Docker Compose
- **Environment:** .env files (python-dotenv)

#### 5.1.4 External Services
- **Google Maps Platform:**
  - Maps JavaScript API (visualization)
  - Routes API (TSP optimization, distance matrix)
  - Geocoding API (address → coordinates)
  - Places API (autocomplete, optional)
- **WhatsApp:** Deep linking (no official API needed)

### 5.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│              (React + Vite + Tailwind)                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     │ REST API
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend - FastAPI                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Layer (Routers)                 │   │
│  │   /auth  /recipients  /couriers  /assignments    │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Business Logic (Services)              │   │
│  │  - AuthService                                   │   │
│  │  - RecipientService                              │   │
│  │  - AssignmentService                             │   │
│  │  - OptimizationService (CVRP/TSP)                │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ↓                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Data Access Layer (DAL)                │   │
│  │             SQLAlchemy ORM                       │   │
│  └─────────────────┬────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL + PostGIS                       │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Users  │  │Recipients│  │ Couriers │  │Assignment│  │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌─────────────┐  ┌──────────────────┐                  │
│  │   Regions   │  │  Status History  │                  │
│  └─────────────┘  └──────────────────┘                  │
└────────────────────────────────────────┬────────────────┘
                                         │
┌────────────────────────────────────────┴────────────────┐
│              External Services                          │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  Google Maps APIs   │  │    WhatsApp (Links)     │   │
│  │  - Routes API       │  │    wa.me/...            │   │
│  │  - Geocoding        │  │                         │   │
│  │  - Maps JavaScript  │  │                         │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│  ┌─────────────────────┐                                │
│  │   Google OR-Tools   │                                │
│  │   (CVRP Solver)     │                                │
│  └─────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Folder Structure

#### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Dependency injection
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── recipient.py
│   │   ├── courier.py
│   │   ├── assignment.py
│   │   ├── region.py
│   │   └── status_history.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── recipient.py
│   │   ├── courier.py
│   │   ├── assignment.py
│   │   └── region.py
│   ├── routers/                # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── recipients.py
│   │   ├── couriers.py
│   │   ├── assignments.py
│   │   └── regions.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── recipient_service.py
│   │   ├── courier_service.py
│   │   ├── assignment_service.py
│   │   ├── optimization_service.py  # CVRP/TSP
│   │   └── maps_service.py          # Google APIs wrapper
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   ├── base_repository.py
│   │   ├── recipient_repository.py
│   │   ├── courier_repository.py
│   │   └── assignment_repository.py
│   ├── utils/                  # Utilities
│   │   ├── __init__.py
│   │   ├── security.py         # Password hashing, JWT
│   │   ├── validators.py
│   │   └── constants.py
│   └── tests/                  # Unit & integration tests
│       ├── __init__.py
│       ├── test_recipients.py
│       ├── test_couriers.py
│       └── test_assignments.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── .env.example
├── .gitignore
├── requirements.txt
├── pyproject.toml
├── pytest.ini
├── Dockerfile
└── README.md
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # Main app component
│   ├── components/             # Reusable components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── table.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── badge.jsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── common/
│   │   │   ├── DataTable.jsx
│   │   │   ├── SearchFilter.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── StatusPill.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   └── maps/
│   │       ├── MapView.jsx
│   │       ├── MarkerWithTooltip.jsx
│   │       └── PolylineRoute.jsx
│   ├── features/               # Feature-based modules
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── recipients/
│   │   │   ├── RecipientList.jsx
│   │   │   ├── RecipientDetail.jsx
│   │   │   ├── RecipientForm.jsx
│   │   │   └── RecipientTable.jsx
│   │   ├── couriers/
│   │   │   ├── CourierList.jsx
│   │   │   ├── CourierDetail.jsx
│   │   │   └── CourierForm.jsx
│   │   └── assignments/
│   │       ├── AssignmentList.jsx
│   │       ├── AssignmentDetail.jsx
│   │       ├── CreateAssignment/
│   │       │   ├── Step1ViewRecipients.jsx
│   │       │   ├── Step2SelectCouriers.jsx
│   │       │   ├── Step3PreviewAssignment.jsx
│   │       │   └── AssignmentWizard.jsx
│   │       ├── MapTableSync.jsx
│   │       └── DraggableRecipientRow.jsx
│   ├── services/               # API service layer
│   │   ├── api.js              # Axios instance
│   │   ├── authService.js
│   │   ├── recipientService.js
│   │   ├── courierService.js
│   │   ├── assignmentService.js
│   │   └── regionService.js
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useRecipients.js
│   │   ├── useCouriers.js
│   │   ├── useAssignments.js
│   │   ├── useMapSync.js
│   │   └── usePagination.js
│   ├── utils/                  # Utility functions
│   │   ├── constants.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── colors.js           # Color palette
│   ├── routes/                 # React Router
│   │   └── index.jsx
│   └── assets/
│       ├── images/
│       └── styles/
│           └── index.css
├── public/
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
└── README.md
```

### 5.4 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Regions tables
CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    INDEX idx_name (name)
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    province_id INT REFERENCES provinces(id),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    INDEX idx_province (province_id),
    INDEX idx_name (name)
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    INDEX idx_city (city_id),
    INDEX idx_name (name)
);

CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    district_id INT REFERENCES districts(id),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    INDEX idx_district (district_id),
    INDEX idx_name (name)
);

-- Couriers table
CREATE TABLE couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_phone (phone),
    INDEX idx_name (name)
);

-- Recipients table
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    province_id INT REFERENCES provinces(id),
    city_id INT REFERENCES cities(id),
    district_id INT REFERENCES districts(id),
    village_id INT REFERENCES villages(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS
    num_packages INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Unassigned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_status (status),
    INDEX idx_location USING GIST (location),
    INDEX idx_province (province_id),
    INDEX idx_city (city_id),
    INDEX idx_name (name),
    CHECK (status IN ('Unassigned', 'Assigned', 'Delivery', 'Done', 'Return'))
);

-- Status history table
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_id),
    INDEX idx_changed_at (changed_at)
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    courier_id UUID REFERENCES couriers(id),
    route_data JSONB,  -- Store TSP/CVRP output
    total_distance_meters FLOAT,
    total_duration_seconds INT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_courier (courier_id),
    INDEX idx_created_at (created_at)
);

-- Assignment recipients junction table
CREATE TABLE assignment_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,  -- Order in route
    distance_from_previous_meters FLOAT,
    duration_from_previous_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id, recipient_id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_sequence (assignment_id, sequence_order)
);
```

### 5.5 API Specifications

Base URL: `http://localhost:8000/api/v1`

#### Authentication Endpoints
```
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

#### Recipient Endpoints
```
GET    /recipients                    # List with pagination, filters
GET    /recipients/{id}                # Detail
POST   /recipients                     # Create
PUT    /recipients/{id}                # Update
DELETE /recipients/{id}                # Soft delete
DELETE /recipients/bulk                # Bulk delete
GET    /recipients/{id}/history        # Status history
```

#### Courier Endpoints
```
GET    /couriers                       # List with pagination
GET    /couriers/{id}                  # Detail + assignments
POST   /couriers                       # Create
PUT    /couriers/{id}                  # Update
DELETE /couriers/{id}                  # Soft delete
```

#### Assignment Endpoints
```
GET    /assignments                    # List with filters
GET    /assignments/{id}               # Detail
POST   /assignments/optimize           # Run TSP/CVRP
POST   /assignments                    # Create
PUT    /assignments/{id}               # Update
DELETE /assignments/{id}               # Soft delete
PUT    /assignments/{id}/recipients    # Add/remove recipients
PUT    /assignments/{id}/status        # Bulk status update
PUT    /assignments/{id}/recipients/{rid}/status  # Individual status
```

#### Region Endpoints
```
GET    /regions/provinces
GET    /regions/cities?province_id={id}&search={query}&token={cursor}
GET    /regions/districts?city_id={id}&search={query}&token={cursor}
GET    /regions/villages?district_id={id}&search={query}&token={cursor}
```

#### Optimization Endpoint (Internal)
```
POST   /optimize/tsp
POST   /optimize/cvrp
```

### 5.6 Third-Party Integrations

#### Google Maps Platform Setup
```
Required APIs:
- Maps JavaScript API
- Routes API
- Geocoding API

Cost Estimation (per month):
- Maps loads: ~10,000 loads × $7/1000 = $70
- Routes API: ~1,000 calls × $5/1000 = $5
- Geocoding: ~500 calls × $5/1000 = $2.5
Total: ~$77.5/month

Optimization:
- Cache geocoding results
- Batch route calculations
- Use distance matrix when possible
```

#### WhatsApp Integration
```
Method: Deep linking (no API key needed)
URL format: https://wa.me/{phone}?text={encoded_message}
Character limit: ~2000 chars
Fallback: Copy to clipboard if fails
```

---

## 6. User Interface & Design

### 6.1 Design System

#### 6.1.1 Color Palette
```css
/* Primary Colors */
--primary-blue: #3B82F6;
--primary-dark: #1E40AF;
--primary-light: #DBEAFE;

/* Status Colors */
--status-unassigned: #6B7280;  /* Gray */
--status-assigned: #F59E0B;     /* Yellow */
--status-delivery: #3B82F6;     /* Blue */
--status-done: #10B981;         /* Green */
--status-return: #EF4444;       /* Red */

/* Semantic Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Background */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;
--bg-tertiary: #F3F4F6;
```

#### 6.1.2 Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### 6.1.3 Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

#### 6.1.4 Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

#### 6.1.5 Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### 6.2 Component Specifications

#### 6.2.1 Status Pill Component
```jsx
<Badge variant="unassigned">Unassigned</Badge>
<Badge variant="assigned">Assigned</Badge>
<Badge variant="delivery">Delivery</Badge>
<Badge variant="done">Done</Badge>
<Badge variant="return">Return</Badge>

/* Props */
variant: 'unassigned' | 'assigned' | 'delivery' | 'done' | 'return'
size: 'sm' | 'md' | 'lg'
```

#### 6.2.2 Data Table Component
```jsx
<DataTable
  columns={columns}
  data={data}
  searchable
  filterable
  sortable
  pagination={{ options: [10, 30, 50, 100] }}
  onRowClick={handleRowClick}
  checkboxSelection
  onSelectionChange={handleSelection}
/>
```

#### 6.2.3 Map Component
```jsx
<MapView
  recipients={recipients}
  assignments={assignments}
  mode="all" | "city-grouped"
  onMarkerHover={handleMarkerHover}
  onMarkerClick={handleMarkerClick}
  syncWithTable
  showPolylines
  colorScheme={colorScheme}
/>
```

### 6.3 Page Layouts

#### 6.3.1 Main Layout
```
┌─────────────────────────────────────────────┐
│  Header (Logo | Title | User Menu)          │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Side │         Main Content Area            │
│ bar  │                                      │
│      │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

#### 6.3.2 List Page Layout
```
┌───────────────────────────────────────────────────┐
│  Page Title                   [+ Buat Button]     │
├───────────────────────────────────────────────────┤
│  [Search] [Filters...] [Bulk Actions if selected] │
├───────────────────────────────────────────────────┤
│                                                   │
│              Data Table                           │
│                                                   │
├───────────────────────────────────────────────────┤
│  Pagination                                       │
└───────────────────────────────────────────────────┘
```

#### 6.3.3 Detail Page Layout
```
┌───────────────────────────────────────────────────┐
│  ← Back | Page Title      [Ubah] [Hapus]          │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────┐  ┌────────────────────────┐  │
│  │                 │  │                        │  │
│  │   Google Map    │  │   Detail Information   │  │
│  │                 │  │                        │  │
│  └─────────────────┘  └────────────────────────┘  │
│                                                   │
│  Related Data Table (if applicable)               │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### 6.3.4 Create Assignment Wizard Layout
```
Step 1-2:
┌───────────────────────────────────────────────────┐
│  Step Indicator: ① → ② → ③ → ④                    │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │                                             │  │
│  │         Google Maps (50% width)             │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │         Data Tables (50% width)             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│              [Kembali]  [Selanjutnya]             │
└───────────────────────────────────────────────────┘

Step 3 (Preview):
┌───────────────────────────────────────────────────┐
│  Step Indicator: ① → ② → ③ → ④                    │
├───────────────────────────────────────────────────┤
│  Google Maps (top, full width)                    │
├───────────────────────────────────────────────────┤
│  Assignment Tables (scrollable)                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Courier: John Doe                            │ │
│  │ Assignment 1 (editable name)                 │ │
│  │ [Drag & Drop Table]                          │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │ Courier: Jane Smith                          │ │
│  │ Assignment 2                                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  [Removed Recipients Container]                   │
│                                                   │
│         [Kembali]  [Buat Assignment]              │
└───────────────────────────────────────────────────┘
```

### 6.4 Interaction Patterns

#### 6.4.1 Map-Table Synchronization
```javascript
// Hover Interaction
onTableRowHover(recipientId) {
  // Highlight marker on map
  marker.setOpacity(1.0);
  otherMarkers.setOpacity(0.3);
  
  // Change row background to marker color
  row.style.backgroundColor = markerColor;
}

// Click Interaction
onMarkerClick(recipientId) {
  // Scroll table to row
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Highlight row temporarily (2 seconds)
  row.classList.add('highlight');
  setTimeout(() => row.classList.remove('highlight'), 2000);
}

// Tooltip
onMarkerHover(recipient) {
  showTooltip({
    content: `${recipient.name}\n${recipient.address}`,
    position: markerPosition
  });
}
```

#### 6.4.2 Drag & Drop
```javascript
// React Beautiful DnD structure
<DragDropContext onDragEnd={handleDragEnd}>
  {assignments.map(assignment => (
    <Droppable droppableId={assignment.id}>
      {(provided) => (
        <Table ref={provided.innerRef} {...provided.droppableProps}>
          {assignment.recipients.map((recipient, index) => (
            <Draggable draggableId={recipient.id} index={index}>
              {(provided) => (
                <TableRow
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  {/* Row content */}
                </TableRow>
              )}
            </Draggable>
          ))}
        </Table>
      )}
    </Droppable>
  ))}
</DragDropContext>

// On drag end: update colors, recalculate capacity
```

#### 6.4.3 Status Update Flow
```javascript
// Bulk Update
onBulkStatusUpdate(newStatus) {
  // Show confirmation dialog
  if (confirm(`Update ${selectedCount} recipients to ${newStatus}?`)) {
    // Show loading state
    setLoading(true);
    
    // API call
    await updateStatus(selectedIds, newStatus);
    
    // Success feedback
    toast.success(`${selectedCount} recipients updated`);
    
    // Refresh data
    refetch();
  }
}

// Individual Update
onIndividualStatusUpdate(recipientId, newStatus) {
  // No confirmation for individual
  // Instant update with optimistic UI
  updateLocal(recipientId, newStatus);
  
  // API call in background
  await updateStatus([recipientId], newStatus);
  
  // Toast on success/error
}
```

---

## 7. User Flows

### 7.1 Complete Flow: Daily Assignment Creation (Rekomendasi Mode)

```
PRECONDITIONS:
- Admin logged in
- 50 recipients with status "Unassigned"
- 5 couriers available
- Depot location configured

FLOW:

1. Dashboard → Navigate to "Buat Assignment"
   Duration: 5 seconds

2. Step 1: View Recipients
   ├─ Page loads with map + table (loading 2s)
   ├─ Admin sees 50 markers on map
   ├─ Admin clicks "Mode: Rekomendasi" toggle
   ├─ Admin clicks "Select All" checkbox (50 recipients selected)
   ├─ Admin inputs "Kapasitas Maksimal: 12 paket"
   ├─ Admin clicks "Selanjutnya"
   Duration: 30 seconds

3. Step 2: Select Couriers
   ├─ Table shows 5 couriers
   ├─ Admin clicks "Select All" (5 couriers selected)
   ├─ Admin clicks "Selanjutnya"
   Duration: 10 seconds

4. Algorithm Processing (Background)
   ├─ Show progress indicator
   ├─ Step 1: Running CVRP optimization... 40%
   ├─ Step 2: Calculating routes... 70%
   ├─ Step 3: Generating preview... 90%
   Duration: 30-60 seconds

5. Step 3: Preview Assignment
   ├─ Page shows 5 assignment tables
   ├─ Map shows 5 colored polylines
   ├─ Assignment 1: 10 recipients, 11 packages, 18.5 km
   ├─ Assignment 2: 10 recipients, 12 packages, 16.2 km
   ├─ Assignment 3: 10 recipients, 11 packages, 17.8 km
   ├─ Assignment 4: 10 recipients, 10 packages, 15.4 km
   ├─ Assignment 5: 10 recipients, 11 packages, 14.1 km
   ├─ Total distance: 82 km (vs ~105 km manual)
   ├─ Admin reviews, satisfied with result
   ├─ (Optional) Admin drags 1 recipient for adjustment
   ├─ Admin clicks "Buat Assignment"
   Duration: 2 minutes

6. Save & Redirect
   ├─ Saving to database... (2s)
   ├─ Success toast: "5 assignments berhasil dibuat"
   ├─ Redirect to Assignment List
   ├─ All 50 recipients now have status "Assigned"
   Duration: 5 seconds

TOTAL TIME: ~4 minutes (vs ~2 hours manual)
RESULT: 23% distance reduction, optimal clustering
```

### 7.2 Flow: Tracking Delivery Progress

```
PRECONDITIONS:
- Assignment exists with 10 recipients
- All recipients status = "Assigned"
- Courier has started delivery

FLOW:

1. Courier calls: "Saya sudah mulai pengantaran"
   ├─ Admin opens Assignment Detail page
   ├─ Admin clicks bulk button "Kirim" (blue)
   ├─ Confirmation: "Update 10 recipients to Delivery?"
   ├─ Admin confirms
   ├─ All 10 recipients: Assigned → Delivery
   ├─ Status pills turn blue
   ├─ Toast: "Status updated successfully"
   Duration: 15 seconds

2. Courier calls: "Sudah sampai di Penerima #1"
   ├─ Admin clicks "Tiba di Penerima" button di row #1
   ├─ No confirmation (individual action)
   ├─ Recipient #1: Delivery → Done
   ├─ Pill turns green
   ├─ Silent update (no toast for individual)
   Duration: 5 seconds

3. Courier calls: "Penerima #2 tidak ada di rumah"
   ├─ Admin clicks "Dikembalikan ke Gudang" di row #2
   ├─ Recipient #2: Delivery → Return
   ├─ Pill turns red
   Duration: 5 seconds

4. Courier continues delivery (repeat step 2)
   ├─ Recipient #3: Delivery → Done
   ├─ Recipient #4: Delivery → Done
   ├─ ... (continue for all delivered)
   
5. End of day: 8 Done, 2 Return
   ├─ Admin can see status distribution
   ├─ Can handle Return recipients tomorrow

RESULT: Real-time status tracking, clear audit trail
```

### 7.3 Flow: Emergency Reassignment

```
PRECONDITIONS:
- Assignment A has 12 recipients, Courier: John
- John suddenly unavailable (emergency)
- Need to redistribute to other couriers

FLOW:

1. Admin opens Assignment A detail
   Duration: 2 seconds

2. Admin clicks "Mode Ubah"
   ├─ Delete buttons appear on all rows
   Duration: 1 second

3. Admin clicks delete on all 12 rows
   ├─ All recipients move to "Removed Recipients" container
   ├─ Assignment A now empty
   Duration: 30 seconds

4. Admin clicks "Simpan Perubahan"
   ├─ Confirmation: "Save empty assignment?"
   ├─ Admin confirms (untuk preserve history)
   ├─ All 12 recipients: Assigned → Unassigned
   Duration: 5 seconds

5. Admin opens Assignment B detail (Courier: Jane)
   ├─ Admin clicks "Mode Ubah"
   ├─ Admin clicks "Add Row" 6 times
   ├─ Selects 6 recipients from dropdown
   ├─ Admin clicks "Simpan Perubahan"
   ├─ 6 recipients: Unassigned → Assigned (to Assignment B)
   Duration: 2 minutes

6. Repeat for Assignment C (add 6 recipients)
   Duration: 2 minutes

7. Admin sends WhatsApp to Jane and Mike
   ├─ Opens Assignment B, clicks "Kirim Data Penerima"
   ├─ WhatsApp opens with pre-filled message
   ├─ Repeat for Assignment C

TOTAL TIME: 6 minutes
RESULT: Emergency handled, all recipients reassigned
```

---

## 8. State Machine & Business Logic

### 8.1 Recipient Status State Machine

```
┌─────────────┐
│ Unassigned  │ ◄─────────────────────────────┐
└──────┬──────┘                               │
       │                                      │
       │ Create Assignment                    │
       │ + Assign to Courier                  │
       │                                      │
       ↓                                      │
┌─────────────┐                               │
│  Assigned   │                               │
└──────┬──────┘                               │
       │                                      │
       │ Click "Kirim"                        │
       │                                      │
       ↓                                      │
┌─────────────┐                               │
│  Delivery   │ ──────────────┐               │
└──────┬──────┘               │               │
       │                      │               │
       │                      │               │
   ┌───┴────┐                 │               │
   │        │                 │               │
   │        │                 │ "Dikembalikan │
   │        │  "Tiba di       │  ke Gudang"   │
   │        │   Penerima"     │               │
   │        ↓                 ↓               │
   │    ┌───────────┐   ┌──────────┐          │
   │    │   Done    │   │  Return  │──────────┘
   │    │ (Terminal)│   └────┬─────┘
   │    └───────────┘        │
   │                         │
   │                         │ "Kirim" (retry)
   │                         │
   └─────────────────────────┘

Alternative: Delete from Assignment
Return/Delivery → Unassigned (via "Hapus" in edit mode)
```

### 8.2 State Transition Rules

| From State | Action | To State | Trigger | Validation |
|-----------|--------|----------|---------|------------|
| Unassigned | Assign to courier | Assigned | "Buat Assignment" | Must have assignment + courier |
| Assigned | Start delivery | Delivery | "Kirim" button | - |
| Delivery | Completed | Done | "Tiba di Penerima" | Terminal state |
| Delivery | Not delivered | Return | "Dikembalikan ke Gudang" | - |
| Return | Retry delivery | Delivery | "Kirim" button | - |
| Return | Remove from assignment | Unassigned | "Hapus" in edit mode | - |
| Delivery | Remove from assignment | Unassigned | "Hapus" in edit mode | - |
| Assigned | Remove from assignment | Unassigned | Delete assignment | Cannot if status = Done |

### 8.3 Business Rules

#### BR-001: Assignment Creation
```
RULES:
- Cannot create empty assignment
- Must have at least 1 recipient
- Must have exactly 1 courier per assignment
- Each recipient can only be in 1 active assignment
- Capacity validation in rekomendasi mode:
  - Sum(recipient.num_packages) <= courier_capacity × num_couriers
  - If exceeded, show warning before proceeding
```

#### BR-002: Status Transitions
```
RULES:
- Only admins can change status
- Cannot skip states (must follow state machine)
- Cannot change status if recipient deleted
- Status change creates audit entry in status_history table
- Bulk status update only if all recipients have same current status
```

#### BR-003: Assignment Deletion
```
RULES:
- Can only delete if NO recipients have status "Done"
- Soft delete (set is_deleted = true)
- All recipients return to "Unassigned" status
- Cannot delete if any delivery in progress (status = Delivery)
- Confirmation required with warning message
```

#### BR-004: Recipient Management
```
RULES:
- Cannot delete recipient if in active assignment
- Cannot edit recipient if status = "Delivery" or "Done"
- Phone number must be unique
- Coordinates must be within Indonesia bounds:
  - Latitude: -11° to 6°
  - Longitude: 95° to 141°
```

#### BR-005: CVRP Optimization Constraints
```
RULES:
- Depot location: user-configurable
- No return to depot (open VRP)
- Capacity constraint: sum(packages) <= capacity per courier
- Each recipient visited exactly once
- No time window constraints (Phase 1)
- Minimize total distance as primary objective
```

---

## 9. API Specifications

### 9.1 Request/Response Formats

#### Standard Success Response
```json
{
  "status": "success",
  "data": { /* payload */ },
  "message": "Operation successful"
}
```

#### Standard Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "phone",
        "message": "Phone number already exists"
      }
    ]
  }
}
```

#### Pagination Response
```json
{
  "status": "success",
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "per_page": 30,
      "total_items": 150,
      "total_pages": 5
    }
  }
}
```

### 9.2 Endpoint Details

#### POST /api/v1/auth/login
```
Request:
{
  "username": "admin",
  "password": "password123"
}

Response (200):
{
  "status": "success",
  "data": {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 28800,
    "user": {
      "id": "uuid",
      "username": "admin",
      "role": "admin"
    }
  }
}

Errors:
- 401: Invalid credentials
- 429: Too many login attempts
```

#### GET /api/v1/recipients
```
Query Params:
- page: int (default: 1)
- per_page: int (10|30|50|100, default: 30)
- search: string (search all fields)
- status: string (Unassigned|Assigned|Delivery|Done|Return)
- province_id: int
- city_id: int
- district_id: int
- village_id: int
- sort_by: string (name|created_at|status)
- sort_order: string (asc|desc)

Response (200):
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "John Doe",
        "phone": "081234567890",
        "address": "Jl. Example No. 123",
        "province": { "id": 31, "name": "DKI Jakarta" },
        "city": { "id": 3171, "name": "Jakarta Selatan" },
        "district": { "id": 317101, "name": "Kebayoran Baru" },
        "village": { "id": 3171011, "name": "Senayan" },
        "location": {
          "lat": -6.2088,
          "lng": 106.8456
        },
        "num_packages": 2,
        "status": "Unassigned",
        "created_at": "2025-01-10T10:00:00Z",
        "updated_at": "2025-01-10T10:00:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### POST /api/v1/recipients
```
Request:
{
  "name": "John Doe",
  "phone": "081234567890",
  "address": "Jl. Example No. 123",
  "province_id": 31,
  "city_id": 3171,
  "district_id": 317101,
  "village_id": 3171011,
  "location": {
    "lat": -6.2088,
    "lng": 106.8456
  },
  "num_packages": 2
}

Response (201):
{
  "status": "success",
  "data": { /* created recipient */ },
  "message": "Recipient created successfully"
}

Errors:
- 400: Validation error
- 409: Phone number already exists
```

#### POST /api/v1/assignments/optimize
```
Request (CVRP Mode):
{
  "mode": "cvrp",
  "depot_location": {
    "lat": -6.2,
    "lng": 106.8
  },
  "recipient_ids": ["uuid1", "uuid2", ...],
  "num_couriers": 5,
  "capacity_per_courier": 12
}

Request (Manual/TSP Mode):
{
  "mode": "tsp",
  "depot_location": {
    "lat": -6.2,
    "lng": 106.8
  },
  "assignments": [
    {
      "name": "Assignment 1",
      "recipient_ids": ["uuid1", "uuid2", "uuid3"]
    },
    {
      "name": "Assignment 2",
      "recipient_ids": ["uuid4", "uuid5"]
    }
  ]
}

Response (200):
{
  "status": "success",
  "data": {
    "assignments": [
      {
        "id": "temp-1",  // temporary ID untuk preview
        "name": "Assignment 1",
        "recipient_ids": ["uuid1", "uuid3", "uuid2"],  // optimized order
        "route_data": {
          "total_distance_meters": 18500,
          "total_duration_seconds": 2700,
          "polyline": "encoded_polyline_string",
          "legs": [
            {
              "from_location": { "lat": -6.2, "lng": 106.8 },
              "to_location": { "lat": -6.21, "lng": 106.81 },
              "distance_meters": 2500,
              "duration_seconds": 420
            }
          ]
        }
      }
    ],
    "total_distance_meters": 82000,
    "total_duration_seconds": 14500,
    "computation_time_seconds": 45
  }
}

Errors:
- 400: Invalid parameters
- 422: No feasible solution (capacity exceeded)
- 504: Optimization timeout (>120s)
```

#### POST /api/v1/assignments
```
Request:
{
  "assignments": [
    {
      "name": "Assignment 1",
      "courier_id": "uuid-courier",
      "recipient_ids": ["uuid1", "uuid2"],  // in optimized order
      "route_data": { /* from optimization response */ }
    }
  ]
}

Response (201):
{
  "status": "success",
  "data": {
    "created_assignments": [ /* array of created assignments */ ]
  },
  "message": "5 assignments created successfully"
}

Side Effects:
- All recipients status: Unassigned → Assigned
- Creates status_history entries
```

#### PUT /api/v1/assignments/{id}/status
```
Request (Bulk):
{
  "new_status": "Delivery"
}

Request (Individual):
{
  "recipient_id": "uuid",
  "new_status": "Done"
}

Response (200):
{
  "status": "success",
  "data": {
    "updated_count": 10
  },
  "message": "Status updated successfully"
}

Errors:
- 400: Invalid status transition
- 409: Recipients have different statuses (bulk only)
```

---

## 10. Data Models

### 10.1 Core Entities

#### User
```python
class User(Base):
    __tablename__ = "users"
    
    id: UUID = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username: str = Column(String(50), unique=True, nullable=False)
    password_hash: str = Column(String(255), nullable=False)
    role: str = Column(String(20), default="admin")
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### Recipient
```python
class Recipient(Base):
    __tablename__ = "recipients"
    
    id: UUID
    name: str
    courier_id: UUID
    route_data: dict  # JSONB
    total_distance_meters: float
    total_duration_seconds: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    
    # Relationships
    courier: Courier
    recipients: List[Recipient]  # via junction table
    created_by_user: User
```

#### AssignmentRecipient (Junction Table)
```python
class AssignmentRecipient(Base):
    __tablename__ = "assignment_recipients"
    
    id: UUID
    assignment_id: UUID
    recipient_id: UUID
    sequence_order: int  # 1, 2, 3, ... (order dalam rute)
    distance_from_previous_meters: float
    duration_from_previous_seconds: int
    created_at: datetime
```

#### StatusHistory
```python
class StatusHistory(Base):
    __tablename__ = "status_history"
    
    id: UUID
    recipient_id: UUID
    old_status: str  # nullable (untuk initial creation)
    new_status: str
    changed_by: UUID
    changed_at: datetime
    
    # Relationships
    recipient: Recipient
    changed_by_user: User
```

### 10.2 Enums

```python
class RecipientStatus(str, Enum):
    UNASSIGNED = "Unassigned"
    ASSIGNED = "Assigned"
    DELIVERY = "Delivery"
    DONE = "Done"
    RETURN = "Return"

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"  # future
    VIEWER = "viewer"  # future
```

### 10.3 Pydantic Schemas

#### Recipient Schemas
```python
class RecipientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^(\+62|62|0)[0-9]{9,12}$")
    address: str = Field(..., min_length=1, max_length=500)
    province_id: int
    city_id: int
    district_id: int
    village_id: int
    location: LocationSchema
    num_packages: int = Field(..., ge=1, le=999)

class RecipientCreate(RecipientBase):
    pass

class RecipientUpdate(RecipientBase):
    pass

class RecipientResponse(RecipientBase):
    id: UUID
    status: RecipientStatus
    province: ProvinceSchema
    city: CitySchema
    district: DistrictSchema
    village: VillageSchema
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LocationSchema(BaseModel):
    lat: float = Field(..., ge=-11.0, le=6.0)
    lng: float = Field(..., ge=95.0, le=141.0)
```

#### Assignment Schemas
```python
class AssignmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    courier_id: UUID
    recipient_ids: List[UUID]
    route_data: dict

class AssignmentResponse(BaseModel):
    id: UUID
    name: str
    courier: CourierSchema
    recipients: List[RecipientResponse]
    route_data: dict
    total_distance_meters: float
    total_duration_seconds: int
    created_at: datetime
    
class OptimizationRequest(BaseModel):
    mode: Literal["tsp", "cvrp"]
    depot_location: LocationSchema
    recipient_ids: Optional[List[UUID]] = None
    num_couriers: Optional[int] = None
    capacity_per_courier: Optional[int] = None
    assignments: Optional[List[ManualAssignment]] = None
```

---

## 11. Development Phases

### Phase 1: Foundation (Week 1-2)

**Sprint 1.1: Project Setup & Authentication (5 days)**
- [ ] Initialize Git repository
- [ ] Setup backend (FastAPI + PostgreSQL + PostGIS)
- [ ] Setup frontend (React + Vite + Tailwind + shadcn/ui)
- [ ] Docker Compose configuration
- [ ] Database schema creation & migrations (Alembic)
- [ ] Seed regional data (provinces, cities, districts, villages)
- [ ] Authentication system (login, JWT, password hashing)
- [ ] Protected routes middleware
- [ ] Basic layout (header, sidebar, routing)

**Deliverable:** Working authentication + project skeleton

**Sprint 1.2: CRUD Recipients (5 days)**
- [ ] Backend: Recipient API endpoints (CRUD)
- [ ] Frontend: Recipient list page with table
- [ ] Search, filter, sort, pagination
- [ ] Create/Update recipient forms
- [ ] Regional dropdown cascading
- [ ] Google Maps coordinate picker
- [ ] Delete (single & bulk)
- [ ] Recipient detail page with map
- [ ] Status history table

**Deliverable:** Complete recipient management

---

### Phase 2: Core Features (Week 3-4)

**Sprint 2.1: CRUD Couriers & Basic Assignment (5 days)**
- [ ] Backend: Courier API endpoints
- [ ] Frontend: Courier CRUD pages
- [ ] Backend: Assignment basic CRUD
- [ ] Frontend: Assignment list & detail (read-only)
- [ ] Assignment detail page (map + table)
- [ ] Status update buttons (individual & bulk)
- [ ] Status transition validations

**Deliverable:** Courier management + basic assignment viewing

**Sprint 2.2: Route Optimization Integration (5 days)**
- [ ] Google Routes API integration
- [ ] OR-Tools CVRP implementation
- [ ] TSP optimization service
- [ ] CVRP optimization service
- [ ] POST /optimize endpoint
- [ ] Unit tests untuk optimization logic
- [ ] Error handling & timeouts
- [ ] Performance optimization

**Deliverable:** Working optimization algorithms

---

### Phase 3: Assignment Creation Wizard (Week 5-6)

**Sprint 3.1: Step 1 & 2 (5 days)**
- [ ] Wizard layout & step navigation
- [ ] Step 1: View recipients (Mode All)
- [ ] Step 1: View recipients (Mode Kabupaten/Kota)
- [ ] Map-table synchronization (hover, click)
- [ ] Marker colors & legends
- [ ] Mode toggle (Manual vs Rekomendasi)
- [ ] Manual mode: multi-group creation
- [ ] Rekomendasi mode: capacity input
- [ ] Step 2: Courier selection table
- [ ] State persistence between steps

**Deliverable:** Steps 1-2 working

**Sprint 3.2: Step 3 Preview & Finalization (5 days)**
- [ ] Algorithm execution with progress indicator
- [ ] Preview layout (map + multiple tables)
- [ ] Courier auto-distribution logic
- [ ] Drag & drop between tables (react-beautiful-dnd)
- [ ] Real-time color updates (markers & rows)
- [ ] Removed recipients container
- [ ] Inline name editing
- [ ] Capacity validation
- [ ] Save to database
- [ ] Redirect & toast notifications

**Deliverable:** Complete assignment creation flow

---

### Phase 4: Assignment Management (Week 7)

**Sprint 4.1: Edit & Track (5 days)**
- [ ] Assignment detail edit mode
- [ ] Add/remove recipients in edit mode
- [ ] Save changes functionality
- [ ] Delete assignment (with validations)
- [ ] WhatsApp integration (deep linking)
- [ ] Message formatting for WhatsApp
- [ ] Google Maps URL generation
- [ ] Toast notifications & confirmations
- [ ] Assignment list filters

**Deliverable:** Complete assignment management

---

### Phase 5: Polish & Testing (Week 8)

**Sprint 5.1: UI/UX Refinements (3 days)**
- [ ] Loading states (skeletons, spinners)
- [ ] Error handling & user-friendly messages
- [ ] Empty states
- [ ] Confirmation dialogs
- [ ] Responsive design adjustments
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements
- [ ] Performance optimization (lazy loading, memoization)

**Sprint 5.2: Testing & Bug Fixes (2 days)**
- [ ] Integration testing
- [ ] E2E testing (critical flows)
- [ ] Bug fixes from testing
- [ ] Browser compatibility testing
- [ ] Performance testing (large datasets)
- [ ] Security audit
- [ ] Documentation updates

**Deliverable:** Production-ready application

---

### Phase 6: Deployment & Handover (Week 9)

**Sprint 6.1: Deployment (3 days)**
- [ ] Production environment setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment variables configuration
- [ ] Database migration to production
- [ ] Google Maps API production keys
- [ ] SSL certificate setup
- [ ] Monitoring & logging setup
- [ ] Backup strategy implementation

**Sprint 6.2: Documentation & Training (2 days)**
- [ ] User manual (Bahasa Indonesia)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Developer README
- [ ] Admin training session
- [ ] Video tutorials (optional)
- [ ] Handover meeting
- [ ] Support plan

**Deliverable:** Live production system + documentation

---

## 12. Success Metrics & KPIs

### 12.1 Performance Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time | <3s | Google Lighthouse |
| API Response (95th percentile) | <500ms | Application logs |
| CVRP Optimization (50 recipients) | <60s | Backend timing |
| TSP Optimization (25 waypoints) | <5s | Backend timing |
| Database Query Time | <200ms | PostgreSQL EXPLAIN ANALYZE |
| System Uptime | >99.5% | Monitoring tool |

### 12.2 User Adoption Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Daily Active Admins | 100% of admin team | Login logs |
| Assignment Creation Time | <10 min (avg) | User activity logs |
| Rekomendasi Mode Usage | >80% of assignments | Assignment type tracking |
| Manual Adjustments Rate | <10% of assignments | Edit history tracking |
| System Usage Frequency | >3x per day per admin | Activity logs |

### 12.3 Business Impact Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time Savings | >85% reduction | Before/after comparison |
| Distance Optimization | >15% reduction | Route distance comparison |
| Cost Savings (fuel) | Calculate based on distance | Financial analysis |
| Delivery Success Rate | >95% (status Done) | Status tracking |
| User Satisfaction Score | >4.5/5.0 | Post-deployment survey |

### 12.4 Technical Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Code Test Coverage | >80% | pytest coverage report |
| Code Quality (Python) | A grade | SonarQube / pylint |
| Security Vulnerabilities | 0 critical | OWASP ZAP / Snyk |
| Accessibility Score | >90 | Lighthouse / axe |
| API Error Rate | <1% | Error monitoring |

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Google Maps API Quota Exceeded** | High | Medium | - Implement caching strategy<br>- Monitor usage daily<br>- Set up billing alerts<br>- Fallback to cached data |
| **CVRP Optimization Timeout** | High | Low | - Set timeout limit (120s)<br>- Show progress indicator<br>- Offer to retry with fewer recipients<br>- Fallback to manual mode |
| **Database Performance Degradation** | Medium | Medium | - Proper indexing<br>- Query optimization<br>- Connection pooling<br>- Regular VACUUM |
| **OR-Tools Compatibility Issues** | Medium | Low | - Use stable version<br>- Docker containerization<br>- Extensive testing |
| **Browser Compatibility** | Low | Medium | - Test on major browsers<br>- Polyfills for older browsers<br>- Progressive enhancement |

### 13.2 User Adoption Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Resistance to New System** | High | Medium | - Comprehensive training<br>- Show quick wins early<br>- Side-by-side comparison demo<br>- Gradual rollout |
| **Learning Curve Too Steep** | Medium | Medium | - Intuitive UI design<br>- In-app tooltips<br>- Video tutorials<br>- Dedicated support person |
| **Trust in Algorithm** | Medium | High | - Show distance comparison<br>- Allow manual override<br>- Explain optimization logic<br>- Start with hybrid approach |

### 13.3 Business Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Cost Overrun (Google APIs)** | Medium | Low | - Set spending limits<br>- Monitor daily usage<br>- Optimize API calls<br>- Consider alternatives if needed |
| **Data Loss** | High | Low | - Automated daily backups<br>- Transaction safety<br>- Soft deletes<br>- Test restore procedures |
| **Security Breach** | High | Very Low | - Follow security best practices<br>- Regular security audits<br>- Penetration testing<br>- Keep dependencies updated |

---

## 14. Dependencies & Assumptions

### 14.1 External Dependencies

**Critical Dependencies:**
- Google Maps Platform (Maps, Routes API, Geocoding)
- PostgreSQL + PostGIS
- Python 3.10+
- Node.js 18+

**Service Dependencies:**
- Internet connectivity (for Google APIs)
- WhatsApp (for messaging, via deep links)
- Modern web browser (Chrome 90+)

**Cost Dependencies:**
- Google Maps Platform billing account
- Hosting infrastructure (cloud provider)
- Domain name & SSL certificate

### 14.2 Data Dependencies

**Required Data:**
- Indonesia regional data (provinces, cities, districts, villages)
  - Source: BPS (Badan Pusat Statistik) or similar
  - ~90,000 villages across Indonesia
  - Must be kept updated

**Configuration Data:**
- Depot location coordinates (hardcoded in Phase 1)
- Admin user credentials
- Google API keys

### 14.3 Assumptions

**Technical Assumptions:**
- Stable internet connection (minimum 5 Mbps)
- Desktop/laptop as primary device
- Modern browser with JavaScript enabled
- Screen resolution: 1366x768 minimum

**Business Assumptions:**
- Single depot operation (multi-depot future phase)
- Deliveries within same day (no overnight)
- All vehicles (motor) have same capacity
- All couriers start from depot at same time
- No return to depot required (open VRP)
- No time window constraints (Phase 1)
- Indonesian addresses follow standard format

**User Assumptions:**
- Admin users have basic computer literacy
- Admin users understand Google Maps
- Recipients have valid Indonesian addresses
- Couriers have WhatsApp installed
- Phone numbers are valid and reachable

---

## 15. Appendix

### 15.1 Glossary

| Term | Definition |
|------|------------|
| **CVRP** | Capacitated Vehicle Routing Problem - optimization problem untuk route planning dengan capacity constraints |
| **TSP** | Traveling Salesman Problem - optimization problem untuk finding shortest route visiting all locations |
| **Depot** | Titik awal dan akhir pengantaran (warehouse/gudang) |
| **Assignment** | Pengelompokan recipients yang di-assign ke satu courier |
| **Polyline** | Encoded representation of route path pada Google Maps |
| **Soft Delete** | Marking data sebagai deleted tanpa benar-benar menghapus dari database |
| **Continuation Token** | Token untuk pagination pada large datasets |
| **State Machine** | Model yang mendefinisikan valid state transitions |
| **PostGIS** | PostgreSQL extension untuk geospatial data |

### 15.2 Regional Data Format

```json
{
  "provinces": [
    {
      "id": 31,
      "code": "31",
      "name": "DKI Jakarta"
    }
  ],
  "cities": [
    {
      "id": 3171,
      "province_id": 31,
      "code": "3171",
      "name": "Jakarta Selatan"
    }
  ],
  "districts": [
    {
      "id": 317101,
      "city_id": 3171,
      "code": "317101",
      "name": "Kebayoran Baru"
    }
  ],
  "villages": [
    {
      "id": 3171011,
      "district_id": 317101,
      "code": "3171011",
      "name": "Senayan"
    }
  ]
}
```

### 15.3 Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/rizq_db
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

GOOGLE_MAPS_API_KEY=your-google-api-key
DEPOT_LATITUDE=-6.2088
DEPOT_LONGITUDE=106.8456

CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
ENVIRONMENT=development  # development | staging | production

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your-google-api-key
```

### 15.4 Quick Reference Commands

```bash
# Backend Development
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend Development
cd frontend
npm install
npm run dev

# Database Operations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Testing
pytest
pytest --cov=app tests/
npm run test

# Production Build
docker-compose up --build -d
```

### 15.5 Color Palette Reference

```javascript
// Status Colors (Exact Hex)
export const STATUS_COLORS = {
  unassigned: '#6B7280',  // gray-500
  assigned: '#F59E0B',     // amber-500
  delivery: '#3B82F6',     // blue-500
  done: '#10B981',         // green-500
  return: '#EF4444',       // red-500
};

// Assignment Colors (for map markers & tables)
export const ASSIGNMENT_COLORS = [
  '#3B82F6',  // blue
  '#10B981',  // green
  '#F59E0B',  // amber
  '#8B5CF6',  // purple
  '#EC4899',  // pink
  '#14B8A6',  // teal
  '#F97316',  // orange
  '#6366F1',  // indigo
  '#84CC16',  // lime
  '#06B6D4',  // cyan
];
```

### 15.6 Schneiderman's Eight Golden Rules - Implementation Checklist

✅ **1. Strive for Consistency**
- [ ] Consistent button colors (blue = primary, red = danger, green = success)
- [ ] Consistent terminology (Penerima, Pengantar, Assignment)
- [ ] Consistent table layouts across all pages
- [ ] Consistent form layouts (label above input)
- [ ] Consistent status pill design

✅ **2. Enable Shortcuts for Frequent Users**
- [ ] Keyboard: Enter to submit forms
- [ ] Keyboard: Esc to cancel/close dialogs
- [ ] Keyboard: Ctrl+S to save
- [ ] Bulk operations (select all, bulk delete)
- [ ] Quick filters (status pills clickable)

✅ **3. Offer Informative Feedback**
- [ ] Loading spinners for all async operations
- [ ] Toast notifications for success/error
- [ ] Progress bars for optimization (30-60s)
- [ ] Status pills with clear colors
- [ ] Form validation messages below fields

✅ **4. Design Dialogs to Yield Closure**
- [ ] Clear success messages after operations
- [ ] Redirect to appropriate page after create/update
- [ ] Close dialogs after successful action
- [ ] Show result summary (e.g., "5 assignments created")

✅ **5. Prevent Errors**
- [ ] Form validation before submit (client & server)
- [ ] Confirmation dialogs for destructive actions
- [ ] Disable buttons when action not allowed
- [ ] Clear error messages with suggested fixes
- [ ] Capacity validation in CVRP mode

✅ **6. Permit Easy Reversal**
- [ ] Soft delete (can be restored)
- [ ] Edit mode with "Cancel" button
- [ ] Drag & drop can be undone
- [ ] Back button in wizard preserves state
- [ ] Status changes can be reversed (via state machine)

✅ **7. Support Internal Locus of Control**
- [ ] Manual mode for full control over clustering
- [ ] Override algorithm recommendations (drag & drop)
- [ ] Edit assignments after creation
- [ ] Individual status updates (not just bulk)
- [ ] User decides when to commit changes

✅ **8. Reduce Short-Term Memory Load**
- [ ] Visual feedback (highlighted rows when hover)
- [ ] Breadcrumbs in wizard (step indicator)
- [ ] Preview before commit (Step 3)
- [ ] Persistent filters across navigation
- [ ] Color-coded everything (status, assignments)
- [ ] Map-table sync (hover highlights both)

### 15.7 Testing Checklist

**Unit Tests:**
- [ ] Authentication functions
- [ ] CRUD operations (repositories)
- [ ] Optimization algorithms (CVRP, TSP)
- [ ] Status transition validations
- [ ] Input validation functions
- [ ] Utility functions

**Integration Tests:**
- [ ] API endpoints (all routes)
- [ ] Database operations (create, read, update, delete)
- [ ] Google APIs integration (mock responses)
- [ ] State machine transitions
- [ ] Cascading deletes

**E2E Tests:**
- [ ] User login flow
- [ ] Create recipient (full form)
- [ ] Create assignment (rekomendasi mode, full wizard)
- [ ] Update assignment (edit mode)
- [ ] Status tracking (bulk & individual updates)
- [ ] WhatsApp integration (link generation)

**Performance Tests:**
- [ ] CVRP with 100 recipients
- [ ] Table rendering with 100 rows
- [ ] Map rendering with 200 markers
- [ ] Concurrent users (20 admins)
- [ ] Database query performance

**Security Tests:**
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization checks

### 15.8 Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Backup strategy tested
- [ ] Rollback plan prepared

**Deployment Steps:**
- [ ] Create production database
- [ ] Run database migrations
- [ ] Seed regional data
- [ ] Configure environment variables
- [ ] Setup Google API keys (production)
- [ ] Deploy backend (Docker)
- [ ] Deploy frontend (static hosting)
- [ ] Configure HTTPS/SSL
- [ ] Setup monitoring & logging
- [ ] Configure automated backups

**Post-Deployment:**
- [ ] Smoke tests on production
- [ ] Monitor error logs (first 24h)
- [ ] Monitor API usage (Google)
- [ ] User acceptance testing
- [ ] Admin training completed
- [ ] Support channel established
- [ ] Performance monitoring active

---

## 16. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-10 | Product Team | Initial PRD draft based on requirements |

---
*End of Product Requirements Document*
