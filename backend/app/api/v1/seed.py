"""Database seed helper with realistic church data, activities calendar, and enterprise ChMS modules."""

import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.session import get_db
from app.models.attendance import AttendanceRecord
from app.models.certificates import CertificateTemplate, IssuedCertificate
from app.models.church_activity import ChurchActivity
from app.models.compliance import FCRALog, TaxReceipt
from app.models.event import Event
from app.models.finance import Contribution, Expense, Pledge, PledgeCampaign
from app.models.household import Household
from app.models.ledger import Account, JournalEntry, JournalLine, PayrollRecord, Staff
from app.models.member import Member
from app.models.messaging import MessageBroadcast, MessageLog, MessageTemplate
from app.models.ministry import MemberMinistry, Ministry
from app.models.pastoral import PastoralCareNote, PrayerRequest, VisitorFollowUp

from app.models.user import User

router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("", status_code=200)
def seed_church_data(db: Session = Depends(get_db)) -> dict[str, str]:
    """Seed comprehensive church demo dataset including users, double-entry bookkeeping, church activities, certificates, and tax compliance."""
    today = date.today()

    # Rebuild database tables to ensure all new columns and tables exist
    bind = db.get_bind()
    Base.metadata.drop_all(bind=bind)
    Base.metadata.create_all(bind=bind)

    # 0. User Accounts
    default_users = [
        User(username="admin", email="admin@ecclesia.org", full_name="Senior Pastor / Administrator", hashed_password=User.hash_password("admin123"), role="super_admin", is_active=True),
        User(username="pastor", email="pastor@ecclesia.org", full_name="Pastor Dr. Samuel Thomas", hashed_password=User.hash_password("pastor123"), role="pastor", is_active=True),
        User(username="treasurer", email="treasurer@ecclesia.org", full_name="Head Treasurer & Accountant", hashed_password=User.hash_password("treasurer123"), role="treasurer", is_active=True),
        User(username="elder", email="elder@ecclesia.org", full_name="Elder David Sterling", hashed_password=User.hash_password("elder123"), role="elder", is_active=True),
        User(username="staff", email="staff@ecclesia.org", full_name="Church Office Secretary", hashed_password=User.hash_password("staff123"), role="sub_admin", is_active=True),
        User(username="leader", email="leader@ecclesia.org", full_name="Worship & Youth Leader", hashed_password=User.hash_password("leader123"), role="ministry_leader", is_active=True),
    ]
    db.add_all(default_users)
    db.commit()

    # 1. Households
    households_data = [
        Household(name="The Sterling Family", address="14 2nd Cross, Koramangala 4th Block", city="Bangalore", state="KA", postal_code="560034", home_phone="+91 80 2553 0101", ward_zone="Ward 1 - Koramangala", landmark="Near Sony World Junction", latitude=12.9352, longitude=77.6245),
        Household(name="The Anderson Family", address="88 Palm Avenue, Indiranagar", city="Bangalore", state="KA", postal_code="560038", home_phone="+91 80 2525 0142", ward_zone="Ward 2 - Indiranagar", landmark="Opposite Defense Colony Park", latitude=12.9784, longitude=77.6408),
        Household(name="The Morales Family", address="504 Oak Crest Parkway", city="Bangalore", state="KA", postal_code="560025", home_phone="+91 80 2221 0188", ward_zone="Ward 3 - Richmond Town", landmark="Behind Baldwin School", latitude=12.9610, longitude=77.6040),
        Household(name="The Chen Family", address="89 Cedar Valley Drive, Whitefield", city="Bangalore", state="KA", postal_code="560066", home_phone="+91 80 2845 0199", ward_zone="Ward 4 - Whitefield", landmark="Near ITPL Main Gate", latitude=12.9850, longitude=77.7280),
    ]
    db.add_all(households_data)
    db.commit()

    # 2. Members with PAN, Milestone Dates & Spiritual info
    bday_soon1 = today + timedelta(days=3)
    bday_soon2 = today + timedelta(days=11)
    bday_soon3 = today + timedelta(days=22)
    anniv_soon1 = today + timedelta(days=7)
    anniv_soon2 = today + timedelta(days=18)

    members_data = [
        Member(first_name="Samuel", last_name="Thomas", title="Pastor", leadership_role="Pastor", email="pastor.samuel@example.com", phone="+91 98450 00101", address="12 Cathedral Road", city="Bangalore", state="KA", postal_code="560001", gender="Male", marital_status="Married", occupation="Senior Pastor & Priest", avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", status="Clergy", member_type="Adult", pan_number="AAAPT9901S", language_preference="English", date_of_birth=date(1970, 5, 12), wedding_anniversary=date(1996, 11, 20), baptism_date=date(1985, 4, 15), joined_date=date(2010, 1, 1), notes="Senior Pastor of Ecclesia Church."),
        Member(first_name="David", last_name="Sterling", title="Elder", leadership_role="Elder", email="david.sterling@example.com", phone="+91 98450 11001", address="14 2nd Cross, Koramangala", city="Bangalore", state="KA", postal_code="560034", gender="Male", marital_status="Married", occupation="Architect", avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", status="Active", member_type="Adult", pan_number="AAAPS1234E", tax_id="TAX-US-9912", gift_aid_eligible=True, language_preference="English", date_of_birth=date(1978, bday_soon1.month, bday_soon1.day), wedding_anniversary=date(2004, anniv_soon1.month, anniv_soon1.day), baptism_date=date(1994, 4, 15), confirmation_date=date(1995, 5, 20), joined_date=date(2015, 1, 10), household_id=households_data[0].id, household_role="Head", notes="Serves on church board as Elder.", emergency_contact_name="Grace Sterling", emergency_contact_phone="+91 98450 11002"),
        Member(first_name="Grace", last_name="Sterling", title="Mrs", leadership_role="Minister", email="grace.sterling@example.com", phone="+91 98450 11002", address="14 2nd Cross, Koramangala", city="Bangalore", state="KA", postal_code="560034", gender="Female", marital_status="Married", occupation="Interior Designer", avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", status="Active", member_type="Adult", pan_number="AAAPS1234F", language_preference="English", date_of_birth=date(1982, 9, 14), wedding_anniversary=date(2004, anniv_soon1.month, anniv_soon1.day), baptism_date=date(1998, 8, 20), joined_date=date(2015, 1, 10), household_id=households_data[0].id, household_role="Spouse", notes="Hospitality ministry leader."),
        Member(first_name="Marcus", last_name="Anderson", title="Dr", leadership_role="Deacon", email="marcus.anderson@example.com", phone="+91 98450 22001", address="88 Palm Avenue, Indiranagar", city="Bangalore", state="KA", postal_code="560038", gender="Male", marital_status="Married", occupation="Cardiologist", avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", status="Active", member_type="Adult", pan_number="ABCPM5678K", language_preference="English", date_of_birth=date(1972, bday_soon2.month, bday_soon2.day), wedding_anniversary=date(2001, anniv_soon2.month, anniv_soon2.day), baptism_date=date(1988, 12, 25), joined_date=date(2012, 6, 1), household_id=households_data[1].id, household_role="Head", notes="Deacon & Benevolence coordinator."),
        Member(first_name="Sarah", last_name="Anderson", title="Mrs", email="sarah.anderson@example.com", phone="+91 98450 22002", address="88 Palm Avenue, Indiranagar", city="Bangalore", state="KA", postal_code="560038", gender="Female", marital_status="Married", occupation="Professor", avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", status="Active", member_type="Adult", pan_number="ABCPM5678L", language_preference="English", date_of_birth=date(1975, 4, 18), wedding_anniversary=date(2001, anniv_soon2.month, anniv_soon2.day), baptism_date=date(1992, 3, 10), joined_date=date(2012, 6, 1), household_id=households_data[1].id, household_role="Spouse"),
        Member(first_name="Chloe", last_name="Anderson", email="chloe.anderson@example.com", phone="+91 98450 22003", address="88 Palm Avenue, Indiranagar", city="Bangalore", state="KA", postal_code="560038", gender="Female", marital_status="Single", occupation="College Student", avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", status="Active", member_type="Youth", language_preference="English", date_of_birth=date(2005, 11, 30), baptism_date=date(2018, 6, 12), confirmation_date=date(2020, 11, 15), joined_date=date(2012, 6, 1), household_id=households_data[1].id, household_role="Child"),
        Member(first_name="Carlos", last_name="Morales", title="Minister", leadership_role="Minister", email="carlos.morales@example.com", phone="+91 98450 33001", address="504 Oak Crest Parkway", city="Bangalore", state="KA", postal_code="560025", gender="Male", marital_status="Married", occupation="Software Director", avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", status="Active", member_type="Adult", pan_number="AZXPM9988H", language_preference="English", date_of_birth=date(1985, bday_soon3.month, bday_soon3.day), wedding_anniversary=date(2014, 10, 25), baptism_date=date(2000, 5, 1), joined_date=date(2018, 3, 15), household_id=households_data[2].id, household_role="Head"),
        Member(first_name="Elena", last_name="Morales", title="Mrs", email="elena.morales@example.com", phone="+91 98450 33002", address="504 Oak Crest Parkway", city="Bangalore", state="KA", postal_code="560025", gender="Female", marital_status="Married", occupation="Violinist", avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150", status="Active", member_type="Adult", pan_number="AZXPM9988I", language_preference="English", date_of_birth=date(1988, 1, 20), wedding_anniversary=date(2014, 10, 25), baptism_date=date(2002, 4, 12), joined_date=date(2018, 3, 15), household_id=households_data[2].id, household_role="Spouse"),
        Member(first_name="Jonathan", last_name="Chen", title="Preacher", leadership_role="Preacher", email="jonathan.chen@example.com", phone="+91 98450 44001", address="89 Cedar Valley Drive", city="Bangalore", state="KA", postal_code="560066", gender="Male", marital_status="Married", occupation="Financial Analyst & Lay Preacher", avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150", status="Active", member_type="Adult", pan_number="BCHPC3344J", language_preference="English", date_of_birth=date(1980, 7, 8), wedding_anniversary=date(2009, 8, 12), baptism_date=date(1996, 9, 22), joined_date=date(2016, 9, 1), household_id=households_data[3].id, household_role="Head"),
        Member(first_name="Anthony", last_name="Vargas", title="Brother", email="anthony.vargas@example.com", phone="+91 98450 55001", address="22 St. Mark's Road", city="Bangalore", state="KA", postal_code="560001", gender="Male", marital_status="Single", occupation="Freelance Photographer", avatar_url="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150", status="Active", member_type="Adult", pan_number="AVPPM7788P", language_preference="English", date_of_birth=date(1992, 12, 1), baptism_date=date(2010, 11, 7), joined_date=date(2021, 5, 20), notes="Absent past 4 weeks due to travel."),
        Member(first_name="Hannah", last_name="Wilson", title="Sister", email="hannah.wilson@example.com", phone="+91 98450 66001", address="105 Victoria Layout", city="Bangalore", state="KA", postal_code="560047", gender="Female", marital_status="Single", occupation="Nurse", avatar_url="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150", status="Visitor", member_type="Adult", language_preference="English", date_of_birth=date(1995, 3, 14), first_visit_date=today - timedelta(days=7), notes="Visited first time on last Sunday."),
    ]
    db.add_all(members_data)
    db.commit()

    # 3. Events & Attendance (Past 4 Weeks)
    now = datetime.utcnow()
    events_data = [
        Event(title="Sunday Morning Worship Service", event_type="Sunday Worship", starts_at=now - timedelta(days=7), ends_at=now - timedelta(days=7) + timedelta(hours=2), location="Main Sanctuary", is_completed=True, headcount_adults=115, headcount_children=24),
        Event(title="Sunday Morning Worship Service", event_type="Sunday Worship", starts_at=now - timedelta(days=14), ends_at=now - timedelta(days=14) + timedelta(hours=2), location="Main Sanctuary", is_completed=True, headcount_adults=110, headcount_children=22),
        Event(title="Sunday Morning Worship Service", event_type="Sunday Worship", starts_at=now - timedelta(days=21), ends_at=now - timedelta(days=21) + timedelta(hours=2), location="Main Sanctuary", is_completed=True, headcount_adults=108, headcount_children=20),
        Event(title="Sunday Morning Worship Service", event_type="Sunday Worship", starts_at=now - timedelta(days=28), ends_at=now - timedelta(days=28) + timedelta(hours=2), location="Main Sanctuary", is_completed=True, headcount_adults=120, headcount_children=25),
        Event(title="Upcoming Sunday Worship Service", event_type="Sunday Worship", starts_at=now + timedelta(days=5), ends_at=now + timedelta(days=5, hours=2), location="Main Sanctuary", is_completed=False),
    ]
    db.add_all(events_data)
    db.commit()

    # Attendance: active members attended recent weeks, Anthony Vargas only attended 4 weeks ago
    att_records = []
    for ev_idx in range(3):  # past 1, 2, 3 weeks
        for m in members_data[:8]:
            att_records.append(AttendanceRecord(event_id=events_data[ev_idx].id, member_id=m.id, status="Present", check_in_time=events_data[ev_idx].starts_at))
    att_records.append(AttendanceRecord(event_id=events_data[3].id, member_id=members_data[8].id, status="Present", check_in_time=events_data[3].starts_at))
    db.add_all(att_records)
    db.commit()

    # 4. Church Activities & Events Calendar (Regular and Special church activities)
    activities_data = [
        ChurchActivity(
            title="Sunday Morning Holy Communion Service",
            category="Worship Service",
            activity_type="Regular Weekly",
            starts_at=datetime(today.year, today.month, today.day, 9, 0) + timedelta(days=(6 - today.weekday()) % 7),
            ends_at=datetime(today.year, today.month, today.day, 11, 0) + timedelta(days=(6 - today.weekday()) % 7),
            location="Main Sanctuary",
            organizer_name="Pastor Dr. Samuel Thomas",
            target_group="All Congregation",
            description="Traditional liturgical worship service with sermon and Holy Communion.",
            is_recurring=True,
            recurrence_pattern="Weekly on Sundays at 9:00 AM",
        ),
        ChurchActivity(
            title="Midweek Bible Study & Prayer Fellowship",
            category="Bible Study",
            activity_type="Regular Weekly",
            starts_at=datetime(today.year, today.month, today.day, 19, 0) + timedelta(days=(2 - today.weekday()) % 7),
            ends_at=datetime(today.year, today.month, today.day, 20, 30) + timedelta(days=(2 - today.weekday()) % 7),
            location="Fellowship Hall & Online Zoom",
            organizer_name="Pastor Reuben Mathew",
            target_group="Adults & Young Adults",
            description="In-depth verse-by-verse study of the Epistle to the Romans followed by intercession.",
            is_recurring=True,
            recurrence_pattern="Weekly on Wednesdays at 7:00 PM",
        ),
        ChurchActivity(
            title="Sanctuary Choir & Music Team Practice",
            category="Choir Practice",
            activity_type="Regular Weekly",
            starts_at=datetime(today.year, today.month, today.day, 17, 0) + timedelta(days=(5 - today.weekday()) % 7),
            ends_at=datetime(today.year, today.month, today.day, 19, 0) + timedelta(days=(5 - today.weekday()) % 7),
            location="Choir Room (Sanctuary Balcony)",
            organizer_name="Elena Morales",
            target_group="Choir Members & Musicians",
            description="Rehearsal for Sunday anthems, hymns, and special orchestral pieces.",
            is_recurring=True,
            recurrence_pattern="Weekly on Saturdays at 5:00 PM",
        ),
        ChurchActivity(
            title="Church Board & Elders Monthly Meeting",
            category="Committee Meeting",
            activity_type="Monthly",
            starts_at=datetime(today.year, today.month, 15, 18, 30),
            ends_at=datetime(today.year, today.month, 15, 20, 30),
            location="Pastor's Conference Room",
            organizer_name="Elder David Sterling",
            target_group="Elders & Executive Committee",
            description="Monthly governance review, financial ledger signoff, and pastoral planning.",
            is_recurring=True,
            recurrence_pattern="Third Thursday of every month at 6:30 PM",
        ),
        ChurchActivity(
            title="Community Free Medical & Health Camp",
            category="Community Outreach",
            activity_type="Special Event",
            starts_at=datetime(today.year, today.month, 25, 9, 0),
            ends_at=datetime(today.year, today.month, 25, 14, 0),
            location="Church Community Center",
            organizer_name="Dr. Marcus Anderson",
            target_group="General Public & Neighborhood",
            description="Free doctor consultations, blood sugar tests, and medicine distribution for underprivileged families.",
            is_recurring=False,
        ),
        ChurchActivity(
            title="Annual Church Leadership & Discipleship Retreat",
            category="Special Conference",
            activity_type="Special Event",
            starts_at=datetime(today.year, today.month, 28, 8, 30),
            ends_at=datetime(today.year, today.month, 29, 17, 0),
            location="Ecclesia Retreat Center, Nandi Hills",
            organizer_name="Pastor Dr. Samuel Thomas",
            target_group="Ministry Leaders, Elders & Staff",
            description="Two-day spiritual retreat focusing on church vision, disciple-making, and leadership development.",
            is_recurring=False,
        ),
    ]
    db.add_all(activities_data)
    db.commit()

    # 5. Double-Entry Chart of Accounts (Strictly Balanced Debits = Credits)
    accounts_data = [
        Account(code="1010", name="ICICI Operating Bank Account (General)", account_type="Asset", sub_category="Current Assets", balance=250000.0, is_fcra=False, description="Main church operational bank account"),
        Account(code="1020", name="SBI FCRA Foreign Remittance Account", account_type="Asset", sub_category="Current Assets", balance=150000.0, is_fcra=True, description="Designated FCRA account for overseas grants"),
        Account(code="1030", name="Petty Cash Box", account_type="Asset", sub_category="Current Assets", balance=10000.0, is_fcra=False),
        Account(code="1510", name="Sanctuary Building & Land Asset", account_type="Asset", sub_category="Fixed Assets", balance=12500000.0, is_fcra=False),
        Account(code="1520", name="Audio Visual & Sound System Asset", account_type="Asset", sub_category="Fixed Assets", balance=650000.0, is_fcra=False),
        Account(code="2010", name="Accounts Payable / Vendor Dues", account_type="Liability", sub_category="Current Liabilities", balance=25000.0, is_fcra=False),
        Account(code="2020", name="Staff Payroll TDS Payable (Tax)", account_type="Liability", sub_category="Current Liabilities", balance=15000.0, is_fcra=False),
        Account(code="3010", name="General Church Reserve Equity", account_type="Equity", sub_category="Retained Surplus", balance=12960000.0, is_fcra=False),
        Account(code="3020", name="Building Expansion Restricted Fund", account_type="Equity", sub_category="Designated Fund", balance=400000.0, is_fcra=False),
        Account(code="4010", name="Sunday Tithes & Offerings (Local)", account_type="Revenue", sub_category="Local Giving", balance=350000.0, is_fcra=False),
        Account(code="4020", name="FCRA Foreign Mission Grants", account_type="Revenue", sub_category="Foreign Giving", balance=150000.0, is_fcra=True),
        Account(code="5010", name="Staff Salaries & Clergy Stipend", account_type="Expense", sub_category="Personnel", balance=210000.0, is_fcra=False),
        Account(code="5020", name="Church Utilities & Electricity", account_type="Expense", sub_category="Facilities", balance=38000.0, is_fcra=False),
        Account(code="5030", name="Missions & Outreach Charity", account_type="Expense", sub_category="Ministries", balance=65000.0, is_fcra=False),
        Account(code="5040", name="Worship Tech & Livestreaming", account_type="Expense", sub_category="Worship", balance=27000.0, is_fcra=False),
    ]
    db.add_all(accounts_data)
    db.commit()

    # 6. Balanced Double-Entry Journal Entries
    je1 = JournalEntry(
        entry_number=f"JE-{today.year}-0001",
        entry_date=today - timedelta(days=15),
        description="Sunday Worship Tithes & Offerings Direct Bank Deposit",
        reference="DEP-AUG-W1",
        status="Posted",
        posted_by="Pastor Samuel Thomas",
        is_fcra=False,
    )
    db.add(je1)
    db.flush()
    db.add_all([
        JournalLine(journal_entry_id=je1.id, account_id=accounts_data[0].id, debit=65000.0, credit=0.0, memo="Cash & UPI collections deposited into ICICI"),
        JournalLine(journal_entry_id=je1.id, account_id=accounts_data[9].id, debit=0.0, credit=65000.0, memo="Credit to Sunday Tithes & Offerings"),
    ])
    accounts_data[0].balance += 65000.0
    accounts_data[9].balance += 65000.0

    je2 = JournalEntry(
        entry_number=f"JE-{today.year}-0002",
        entry_date=today - timedelta(days=10),
        description="Electricity and Water Utilities Bill Payment",
        reference="BESCOM-INV-891",
        status="Posted",
        posted_by="Treasurer Office",
        is_fcra=False,
    )
    db.add(je2)
    db.flush()
    db.add_all([
        JournalLine(journal_entry_id=je2.id, account_id=accounts_data[12].id, debit=18500.0, credit=0.0, memo="Debit utilities expense"),
        JournalLine(journal_entry_id=je2.id, account_id=accounts_data[0].id, debit=0.0, credit=18500.0, memo="Credit bank account payment"),
    ])
    accounts_data[12].balance += 18500.0
    accounts_data[0].balance -= 18500.0
    db.commit()

    # 7. Staff & Payroll
    staff_data = [
        Staff(first_name="Samuel", last_name="Thomas", role_title="Senior Pastor & Priest", email="pastor.samuel@ecclesia.org", phone="+91 98450 00101", pan_or_tax_id="AAAPT9901S", base_salary_monthly=55000.0, housing_allowance=15000.0, travel_allowance=5000.0, joined_date=date(2015, 1, 1)),
        Staff(first_name="Reuben", last_name="Mathew", role_title="Worship & Youth Pastor", email="reuben.mathew@ecclesia.org", phone="+91 98450 00102", pan_or_tax_id="ABCPM4402R", base_salary_monthly=35000.0, housing_allowance=8000.0, travel_allowance=3000.0, joined_date=date(2019, 6, 1)),
        Staff(first_name="Mary", last_name="Joseph", role_title="Church Administrator & Accountant", email="admin@ecclesia.org", phone="+91 98450 00103", pan_or_tax_id="AZXPM8803M", base_salary_monthly=28000.0, housing_allowance=5000.0, travel_allowance=2000.0, joined_date=date(2020, 2, 1)),
    ]
    db.add_all(staff_data)
    db.commit()

    db.add_all([
        PayrollRecord(staff_id=staff_data[0].id, pay_period=f"{today.strftime('%B %Y')}", payment_date=today - timedelta(days=18), basic_salary=55000.0, allowances=20000.0, deductions=5000.0, net_pay=70000.0, payment_method="Direct Bank Transfer", status="Disbursed", payslip_reference=f"PAY-{today.strftime('%Y%m')}-001"),
        PayrollRecord(staff_id=staff_data[1].id, pay_period=f"{today.strftime('%B %Y')}", payment_date=today - timedelta(days=18), basic_salary=35000.0, allowances=11000.0, deductions=2500.0, net_pay=43500.0, payment_method="Direct Bank Transfer", status="Disbursed", payslip_reference=f"PAY-{today.strftime('%Y%m')}-002"),
    ])
    db.commit()

    # 8. Contributions, Expenses, Campaigns, and Pledges
    campaign = PledgeCampaign(
        title="Sanctuary Roof & Gallery Expansion Campaign",
        target_amount=1500000.0,
        start_date=today - timedelta(days=90),
        end_date=today + timedelta(days=180),
        description="Renovating church roof and adding balcony seating for 200 members.",
        is_active=True,
    )
    db.add(campaign)
    db.flush()

    db.add_all([
        Pledge(campaign_id=campaign.id, member_id=members_data[0].id, amount_pledged=200000.0, amount_paid=100000.0, status="Active"),
        Pledge(campaign_id=campaign.id, member_id=members_data[2].id, amount_pledged=100000.0, amount_paid=50000.0, status="Active"),
        Pledge(campaign_id=campaign.id, member_id=members_data[5].id, amount_pledged=50000.0, amount_paid=25000.0, status="Active"),
    ])

    contributions_data = [
        Contribution(member_id=members_data[0].id, donor_name="David Sterling", donor_pan_or_tax_id="AAAPS1234E", amount=50000.0, currency="INR", fund="Building Fund", payment_method="UPI", reference_number="UPI/6234891001", date=today - timedelta(days=12), is_fcra=False, tax_receipt_issued=True, tax_receipt_number="80G-2026-00101"),
        Contribution(member_id=members_data[2].id, donor_name="Dr. Marcus Anderson", donor_pan_or_tax_id="ABCPM5678K", amount=25000.0, currency="INR", fund="Tithe", payment_method="Bank Transfer", reference_number="NEFT/ICIC78119", date=today - timedelta(days=8), is_fcra=False, tax_receipt_issued=True, tax_receipt_number="80G-2026-00102"),
        Contribution(member_id=members_data[5].id, donor_name="Carlos Morales", donor_pan_or_tax_id="AZXPM9988H", amount=15000.0, currency="INR", fund="Missions", payment_method="Razorpay", reference_number="pay_rzp_984501", date=today - timedelta(days=4), is_fcra=False),
        Contribution(donor_name="Global Church Missions Foundation (USA)", amount=150000.0, currency="INR", fund="Missions", payment_method="Bank Transfer", reference_number="SWIFT/SBI-FCRA-009", date=today - timedelta(days=20), is_fcra=True, donor_country="USA"),
    ]
    db.add_all(contributions_data)

    expenses_data = [
        Expense(category="Facilities & Utilities", title="Monthly Electricity & Power Bill", amount=18500.0, currency="INR", payee="BESCOM Bangalore Electricity", date=today - timedelta(days=10), payment_method="Bank Transfer", approved_by="Treasurer", receipt_reference="BESCOM-AUG-2026"),
        Expense(category="Worship & Tech", title="Livestreaming Equipment & Cables", amount=8500.0, currency="INR", payee="SoundCraft Audio Electronics", date=today - timedelta(days=14), payment_method="Credit Card", approved_by="Music Pastor", receipt_reference="SND-7712"),
        Expense(category="Missions & Outreach", title="Community Medical Camp Medicine Stock", amount=22000.0, currency="INR", payee="Apollo Pharmacy Bulk Supply", date=today - timedelta(days=22), payment_method="Bank Transfer", approved_by="Outreach Director", receipt_reference="APL-MED-99"),
    ]
    db.add_all(expenses_data)
    db.commit()

    # 9. 80G Tax Receipts & FCRA Logs
    db.add_all([
        TaxReceipt(receipt_number="80G-2026-00101", tax_regime="80G_INDIA", member_id=members_data[0].id, donor_name="David Sterling", donor_pan_or_tax_id="AAAPS1234E", donor_address=members_data[0].address, contribution_id=contributions_data[0].id, amount=50000.0, eligible_tax_amount=50000.0, currency="INR", financial_year="2025-2026", issue_date=today - timedelta(days=12), church_tax_registration_no="CIT(E)/BLR/80G/2024-25/AABTE1234F"),
        TaxReceipt(receipt_number="80G-2026-00102", tax_regime="80G_INDIA", member_id=members_data[2].id, donor_name="Dr. Marcus Anderson", donor_pan_or_tax_id="ABCPM5678K", donor_address=members_data[2].address, contribution_id=contributions_data[1].id, amount=25000.0, eligible_tax_amount=25000.0, currency="INR", financial_year="2025-2026", issue_date=today - timedelta(days=8), church_tax_registration_no="CIT(E)/BLR/80G/2024-25/AABTE1234F"),
    ])

    db.add(
        FCRALog(donor_name="Global Church Missions Foundation", donor_country="USA", foreign_currency="USD", foreign_amount=1800.0, inr_realized_amount=150000.0, exchange_rate=83.33, fcra_purpose_code="Religious / Social Outreach", remittance_date=today - timedelta(days=20), firc_reference="FIRC-SBI-2026-8812")
    )
    db.commit()

    # 10. Certificate Templates & Issued Milestone Certificates
    cert_templates = [
        CertificateTemplate(type="Baptism", title="Certificate of Holy Baptism", scripture_verse="Matthew 28:19 - Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.", body_template="This certifies that {{recipient_name}} was baptized in the name of the Father, Son, and Holy Spirit."),
        CertificateTemplate(type="Wedding", title="Certificate of Holy Matrimony", scripture_verse="Mark 10:9 - What therefore God has joined together, let not man put asunder.", body_template="This certifies that {{recipient_name}} and {{secondary_name}} were united in Holy Matrimony in the presence of God and this congregation."),
        CertificateTemplate(type="Child Dedication", title="Certificate of Child Dedication", scripture_verse="1 Samuel 1:27 - For this child I prayed, and the Lord has granted me my petition.", body_template="This certifies that {{recipient_name}}, child of {{secondary_name}}, was dedicated to the Lord."),
        CertificateTemplate(type="Confirmation", title="Certificate of Holy Confirmation", scripture_verse="2 Timothy 1:6 - Fan into flame the gift of God, which is in you through the laying on of hands.", body_template="This certifies that {{recipient_name}} received the Rite of Holy Confirmation."),
        CertificateTemplate(type="Membership", title="Certificate of Church Membership", scripture_verse="Ephesians 2:19 - Fellow citizens with the saints and members of the household of God.", body_template="This certifies that {{recipient_name}} is an active member in good standing of Ecclesia Church."),
    ]
    db.add_all(cert_templates)
    db.commit()

    db.add_all([
        IssuedCertificate(certificate_number=f"CERT-BAP-{today.year}-0042", certificate_type="Baptism", member_id=members_data[4].id, recipient_name="Chloe Anderson", issue_date=date(2018, 6, 12), event_date=date(2018, 6, 12), officiant_name="Pastor Dr. Samuel Thomas", witness_1="Dr. Marcus Anderson", church_name="St. Luke's Ecclesia Church", church_registration_no="CIT(E)/BLR/80G/2024-25/AABTE1234F", church_address="12 Cathedral Road, Bangalore", verification_code="ECCL-BAP-7788"),
        IssuedCertificate(certificate_number=f"CERT-WED-{today.year}-0018", certificate_type="Wedding", member_id=members_data[5].id, recipient_name="Carlos Morales", secondary_name="Elena Morales", issue_date=date(2014, 10, 25), event_date=date(2014, 10, 25), officiant_name="Pastor Dr. Samuel Thomas", witness_1="David Sterling", church_name="St. Luke's Ecclesia Church", church_registration_no="CIT(E)/BLR/80G/2024-25/AABTE1234F", church_address="12 Cathedral Road, Bangalore", verification_code="ECCL-WED-9901"),
    ])
    db.commit()

    # 11. Mass Messaging Templates (TRAI DLT Compliant & WhatsApp) & Broadcasts
    db.add_all([
        MessageTemplate(name="Sunday Service & Livestream Reminder", category="General", channel="WhatsApp", body_text="Dear {{first_name}}, join us this Sunday for Worship Service at 9:00 AM at Ecclesia Church or online at https://ecclesia-church.org/live. God bless you!", trai_dlt_template_id="1407161234567890123", trai_dlt_entity_id="140155000000001", trai_sender_header="ECCLSA"),
        MessageTemplate(name="Birthday Blessings from Pastoral Team", category="Pastoral", channel="WhatsApp", body_text="Happy Birthday dear {{first_name}}! May the Lord bless you and keep you, and make His face shine upon you in this new year of life. Greetings from St. Luke's Ecclesia Pastoral Team.", trai_dlt_template_id="1407161234567890456", trai_dlt_entity_id="140155000000001", trai_sender_header="ECCLSA"),
        MessageTemplate(name="80G Tax Exemption Receipt Notification", category="Compliance", channel="SMS", body_text="Dear {{first_name}}, thank you for your contribution to Ecclesia Church. Your 80G tax receipt has been generated. Download from member portal.", trai_dlt_template_id="1407161234567890789", trai_dlt_entity_id="140155000000001", trai_sender_header="ECCLSA"),
    ])
    db.commit()

    broadcast1 = MessageBroadcast(
        title="Sunday Worship & Holy Communion Announcement",
        channel="WhatsApp",
        target_group="All Active Members",
        total_recipients=len(members_data),
        sent_count=len(members_data),
        delivered_count=len(members_data),
        failed_count=0,
        status="Completed",
        sent_at=now - timedelta(days=2),
    )
    db.add(broadcast1)
    db.flush()

    for m in members_data[:4]:
        db.add(
            MessageLog(
                broadcast_id=broadcast1.id,
                recipient_name=f"{m.first_name} {m.last_name}",
                recipient_contact=m.phone or m.email or "Phone",
                channel="WhatsApp",
                rendered_message=f"Dear {m.first_name}, join us for Sunday Worship Service at 9:00 AM!",
                status="Delivered",
                gateway_message_id=f"wamid.{uuid.uuid4().hex[:16]}",
                sent_at=now - timedelta(days=2),
            )
        )
    db.commit()

    # 12. Ministries & Pastoral notes
    ministries_data = [
        Ministry(name="Praise & Worship Team", category="Ministry", description="Leads musical worship for all weekend services.", leader_id=members_data[6].id, meeting_time="Saturdays 5:00 PM"),
        Ministry(name="Youth & College Fellowship", category="Department", description="Discipleship and fellowship for students.", leader_id=members_data[4].id, meeting_time="Sundays 11:30 AM"),
        Ministry(name="Outreach & Benevolence", category="Committee", description="Community food pantry, medical camps, and prison ministry.", leader_id=members_data[2].id, meeting_time="First Sunday 1:00 PM"),
    ]
    db.add_all(ministries_data)
    db.commit()

    db.add_all([
        MemberMinistry(member_id=members_data[0].id, ministry_id=ministries_data[2].id, role="Advisor"),
        MemberMinistry(member_id=members_data[4].id, ministry_id=ministries_data[1].id, role="Youth Choir Member"),
        MemberMinistry(member_id=members_data[6].id, ministry_id=ministries_data[0].id, role="Worship Leader & Violinist"),
    ])

    db.add_all([
        PrayerRequest(member_id=members_data[2].id, requester_name="Dr. Marcus Anderson", title="Medical Mission Camp in Rural Mandya", details="Pray for our team of 6 doctors traveling this weekend to conduct free health checkups.", category="Healing", is_confidential=False, status="Active"),
        PrayerRequest(member_id=members_data[0].id, requester_name="David Sterling", title="Mother's Knee Replacement Surgery", details="Pray for smooth surgery and quick recovery for Mrs. Ruth Sterling.", category="Family", is_confidential=True, status="Answered", answer_notes="Surgery completed successfully with no complications!"),
        PastoralCareNote(member_id=members_data[8].id, author_name="Pastor Dr. Samuel Thomas", category="Pastoral Visit", content="Called Anthony to check in following his absence. He is returning to Bangalore next week.", follow_up_needed=True),
    ])
    db.commit()

    return {"status": "success", "message": "Ecclesia ChMS database populated with double-entry ledger, church activities calendar, certificates, messaging, and compliance records."}
