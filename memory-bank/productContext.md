# Product Context

## Why This Project Exists

### Business Problem
Distribution of sembako packages currently relies on manual planning, where an admin spends 1.5-2 hours manually grouping recipients based on administrative city boundaries (e.g., "all Jakarta Selatan packages together"). This approach:
- Ignores actual geographic distances
- Creates inefficient routes
- Wastes courier time and fuel
- Lacks systematic tracking
- Has no audit trail

### Real-World Impact
- **Courier fatigue**: Inefficient routes mean longer days
- **Cost**: Unnecessary fuel consumption (estimated 15%+ waste)
- **Time**: 2 hours of planning per assignment session
- **Errors**: Manual coordination via WhatsApp is error-prone
- **Boundary inefficiency**: Two recipients 500m apart but in different cities get separated

## What We're Solving

### Primary Goal
Transform manual, time-intensive route planning into an automated, optimized process that takes <10 minutes and reduces travel distance by >15%.

### User Pain Points Addressed

**For Admin/Dispatcher:**
1. **Time waste**: Manual planning takes too long
2. **Mental overhead**: Difficult to visualize optimal clusters mentally
3. **Coordination chaos**: Manual WhatsApp messaging to multiple couriers
4. **No accountability**: Can't track who delivered what, when
5. **No flexibility**: Hard to adjust routes on the fly

**For Organization:**
1. **Cost inefficiency**: Wasted fuel and courier hours
2. **Poor utilization**: Couriers not used to capacity
3. **No insights**: Can't measure improvement or performance

## How It Should Work

### User Experience Vision

**Daily Workflow (4 minutes instead of 2 hours):**
1. Admin opens dashboard, sees 50 unassigned recipients
2. Selects "Rekomendasi Mode", inputs capacity (12 packages per courier)
3. Selects all 50 recipients + 5 available couriers
4. System runs CVRP algorithm (30-60 seconds)
5. Preview shows 5 optimal assignments with routes on map
6. Admin makes minor adjustment via drag & drop (optional)
7. Clicks "Create Assignment" - done!
8. One-click sends route details to each courier via WhatsApp

**Key Experience Principles:**
- **Transparency**: Show before/after distance comparison
- **Control**: Always allow manual override
- **Speed**: Optimize for fast, confident decisions
- **Visual**: Map + table synchronization for spatial understanding
- **Forgiving**: Soft deletes, edit mode, undo-friendly

### User Goals

**Admin Needs:**
- Create optimal assignments in <10 minutes
- Trust the algorithm but verify visually
- Adjust assignments when special requests come in
- Track delivery status in real-time
- Send route info to couriers instantly
- See history for accountability

**Organization Needs:**
- Reduce operational costs (fuel, time)
- Improve courier satisfaction (better routes)
- Scale operations without linear cost increase
- Maintain quality through tracking
- Data-driven insights (future phases)

## Value Proposition

### For Admins
- **85% time savings**: 2 hours → 10 minutes
- **Confidence**: Visual validation of routes
- **Flexibility**: Override when needed
- **Simplicity**: Intuitive, requires minimal training

### For Organization
- **15%+ cost reduction**: Shorter routes = less fuel
- **Scalability**: Handle more deliveries with same team
- **Quality**: Systematic tracking and accountability
- **Data**: Foundation for future optimization

### For Couriers
- **Better routes**: Less backtracking, more logical sequences
- **Clarity**: Clear route information via WhatsApp
- **Fairness**: Balanced workload distribution

## Core User Stories

### Epic: Daily Assignment Creation
```
As an Admin, I want to create daily delivery assignments in under 10 minutes,
so that I can spend time on more valuable tasks instead of manual planning.

Acceptance Criteria:
- Select 50 recipients in under 1 minute
- System generates optimal routes in under 60 seconds
- Visual preview allows quick validation
- Can make adjustments via drag & drop
- One-click save creates all assignments
```

### Epic: Algorithm Trust
```
As an Admin, I want to see visual proof that algorithm routes are better,
so that I can confidently use recommendations instead of manual planning.

Acceptance Criteria:
- Map shows all routes with color-coded polylines
- Distance comparison shown (algorithm vs. manual estimate)
- Can validate each assignment visually
- Can override any decision via drag & drop
- System explains clustering logic
```

### Epic: Delivery Tracking
```
As an Admin, I want to track delivery status in real-time,
so that I know which packages are delivered and which need follow-up.

Acceptance Criteria:
- See status pills at a glance (Assigned, Delivery, Done, Return)
- Update status individually or in bulk
- See complete status history for audit
- Filter/search by status
- WhatsApp integration for quick coordination
```

## Problems We're NOT Solving (Phase 1)

- **Real-time GPS tracking**: Couriers don't have tracking devices
- **Mobile app**: Couriers use WhatsApp for route info
- **Multi-depot**: Single warehouse operation only
- **Time windows**: All deliveries same-day, no specific time slots
- **Payment/invoicing**: Out of scope
- **Advanced analytics**: Basic tracking only, no dashboards

## Expected User Behavior

### Adoption Pattern
1. **Week 1**: Side-by-side with manual (validation phase)
2. **Week 2-3**: Primary tool with occasional manual checks
3. **Week 4+**: Full adoption, manual planning rare

### Usage Frequency
- **Daily**: 1-3 assignment creation sessions per day
- **Per session**: Create 3-10 assignments (depending on volume)
- **Status updates**: Throughout the day as deliveries progress

### Learning Curve
- **Hour 1**: Basic CRUD operations (recipients, couriers)
- **Hour 2**: Manual mode assignment (with TSP)
- **Day 2**: Rekomendasi mode (CVRP)
- **Week 1**: Full proficiency including edge cases

## Success Vision (6 Months)

- 100% of admin team using RizQ as primary tool
- Manual planning only for exceptional cases (<5%)
- Measurable cost reduction (fuel, time)
- Courier satisfaction improved (better routes)
- Foundation for Phase 2: mobile app, real-time tracking
- Data-driven optimization insights
