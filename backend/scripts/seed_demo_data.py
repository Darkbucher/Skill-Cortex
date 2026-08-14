import os
import sys
from datetime import datetime, timedelta, timezone
import random

# Add the backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models.student import Student
from app.models.role_skill_map import RoleSkillMap
from app.models.gap_snapshot import GapSnapshot

def seed_demo_data():
    db = SessionLocal()
    try:
        # 1. Fetch existing roles
        roles = db.query(RoleSkillMap).all()
        if not roles:
            print("No roles found in the database. Please run alembic migrations first.")
            return
            
        # 2. Define "stubborn" gaps per role for the heatmap
        # These skills will deliberately be missing for ~70% of students in that role,
        # creating a strong signal in the admin heatmap.
        stubborn_gaps = {
            "SDE": ["Docker", "System Design"],
            "Data Analyst": ["Tableau", "Statistics"],
            "Product Manager": ["A/B Testing", "Agile/Scrum"]
        }

        student_names = [
            "Alice", "Bob", "Charlie", "Diana", "Eve", 
            "Frank", "Grace", "Heidi", "Ivan", "Judy"
        ]
        
        print("Starting demo data generation...")

        for i, name in enumerate(student_names):
            email = f"demo.student{i+1:02d}@knit.ac.in"
            
            # Skip if already seeded
            if db.query(Student).filter(Student.email == email).first():
                print(f"Skipping {email} (already exists)")
                continue

            # Assign a random role and year (2-4)
            role = random.choice(roles)
            req_skills = role.required_skills
            year = random.randint(2, 4)
            
            # Determine if this student will miss the "stubborn" skills
            # (70% chance to intentionally leave these gaps open for the heatmap)
            misses_stubborn = random.random() < 0.70
            stubborn_for_role = stubborn_gaps.get(role.role_name, [])
            
            # 3. Figure out the final skills the student has acquired by "today"
            final_acquired_skills = []
            for req_skill in req_skills:
                skill_name = req_skill["skill"]
                if misses_stubborn and skill_name in stubborn_for_role:
                    continue  # They never acquire this skill
                
                # 60% chance to acquire any other skill
                if random.random() < 0.60:
                    # Give them the required level so it doesn't show up in level_gap_skills
                    final_acquired_skills.append({
                        "skill": skill_name,
                        "level": req_skill.get("min_level", "intermediate")
                    })
            
            # Ensure not 100% and not 0% overlap
            if len(final_acquired_skills) == len(req_skills):
                final_acquired_skills.pop()
            if len(final_acquired_skills) == 0:
                final_acquired_skills.append({
                    "skill": req_skills[0]["skill"],
                    "level": req_skills[0].get("min_level", "intermediate")
                })
                
            # Create student with their final skills
            student = Student(
                name=f"{name} Demo",
                email=email,
                year=year,
                target_role_id=role.id,
                skills=final_acquired_skills,
                created_at=datetime.now(timezone.utc) - timedelta(weeks=8)
            )
            db.add(student)
            db.flush() # Flush to get student.id for the snapshots

            # 4. Generate 3-4 historical gap snapshots over the last 8 weeks
            num_snapshots = random.randint(3, 4)
            
            # To show a progression (downward trend in missing skills), 
            # we gradually "unlock" their final acquired skills over time.
            shuffled_skills = list(final_acquired_skills)
            random.shuffle(shuffled_skills)
            
            for snap_idx in range(num_snapshots):
                # Distribute the snapshots evenly over the 8 weeks
                weeks_ago = 8 - (8 / (num_snapshots - 1)) * snap_idx
                computed_at = datetime.now(timezone.utc) - timedelta(weeks=weeks_ago)
                
                # Proportion of their final skills they had at this point in time
                proportion = (snap_idx + 1) / num_snapshots
                skills_count = int(len(shuffled_skills) * proportion)
                
                # Ensure they have at least 1 skill if they'll eventually have any
                if skills_count == 0 and len(shuffled_skills) > 0:
                    skills_count = 1
                    
                current_skill_names = {s["skill"] for s in shuffled_skills[:skills_count]}
                
                # The gap is the role's required skills minus what they had at that time
                missing = [r["skill"] for r in req_skills if r["skill"] not in current_skill_names]
                
                snap = GapSnapshot(
                    student_id=student.id,
                    computed_at=computed_at,
                    missing_skills=missing,
                    level_gap_skills=[]
                )
                db.add(snap)
            
            print(f"Added {email} targeting {role.role_name} with {num_snapshots} snapshots.")
            
        db.commit()
        print("Demo data seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
