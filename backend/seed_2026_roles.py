import sys
import os

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import SessionLocal
from app.models.role_skill_map import RoleSkillMap

roles_data = [
    {
        "role_name": "AI / LLM Engineer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Python", "min_level": "advanced"},
            {"skill": "PyTorch", "min_level": "intermediate"},
            {"skill": "Transformers", "min_level": "advanced"},
            {"skill": "Prompt Engineering", "min_level": "advanced"},
            {"skill": "LangChain", "min_level": "intermediate"},
            {"skill": "RAG (Retrieval-Augmented Generation)", "min_level": "advanced"},
            {"skill": "Vector Databases", "min_level": "intermediate"},
            {"skill": "FastAPI", "min_level": "intermediate"},
            {"skill": "Docker", "min_level": "beginner"}
        ]
    },
    {
        "role_name": "Cloud-Native Backend Engineer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Go", "min_level": "intermediate"},
            {"skill": "Kubernetes", "min_level": "intermediate"},
            {"skill": "Microservices", "min_level": "advanced"},
            {"skill": "gRPC", "min_level": "intermediate"},
            {"skill": "PostgreSQL", "min_level": "intermediate"},
            {"skill": "Kafka", "min_level": "beginner"},
            {"skill": "Redis", "min_level": "beginner"},
            {"skill": "AWS/GCP", "min_level": "intermediate"},
            {"skill": "CI/CD", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "Full-Stack Developer (Modern Web 2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "TypeScript", "min_level": "advanced"},
            {"skill": "React/Next.js", "min_level": "advanced"},
            {"skill": "Node.js", "min_level": "intermediate"},
            {"skill": "TailwindCSS", "min_level": "intermediate"},
            {"skill": "GraphQL", "min_level": "beginner"},
            {"skill": "PostgreSQL", "min_level": "intermediate"},
            {"skill": "REST APIs", "min_level": "advanced"},
            {"skill": "Git", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "Data Engineer (Modern Data Stack 2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Python", "min_level": "advanced"},
            {"skill": "SQL", "min_level": "advanced"},
            {"skill": "dbt", "min_level": "intermediate"},
            {"skill": "Snowflake/BigQuery", "min_level": "intermediate"},
            {"skill": "Apache Airflow", "min_level": "intermediate"},
            {"skill": "Apache Spark", "min_level": "beginner"},
            {"skill": "Data Modeling", "min_level": "advanced"}
        ]
    },
    {
        "role_name": "DevSecOps Engineer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Linux", "min_level": "advanced"},
            {"skill": "Bash", "min_level": "intermediate"},
            {"skill": "Terraform", "min_level": "intermediate"},
            {"skill": "Docker", "min_level": "advanced"},
            {"skill": "Kubernetes", "min_level": "advanced"},
            {"skill": "CI/CD Pipelines", "min_level": "advanced"},
            {"skill": "Cloud Security", "min_level": "intermediate"},
            {"skill": "AWS IAM", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "Frontend AI-UX Engineer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "TypeScript", "min_level": "advanced"},
            {"skill": "React", "min_level": "advanced"},
            {"skill": "Vercel AI SDK", "min_level": "intermediate"},
            {"skill": "WebSocket", "min_level": "intermediate"},
            {"skill": "TailwindCSS", "min_level": "advanced"},
            {"skill": "Figma", "min_level": "beginner"},
            {"skill": "Accessibility (a11y)", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "Cybersecurity Analyst (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Network Security", "min_level": "advanced"},
            {"skill": "Penetration Testing", "min_level": "intermediate"},
            {"skill": "Python", "min_level": "intermediate"},
            {"skill": "SIEM Tools", "min_level": "intermediate"},
            {"skill": "Linux", "min_level": "advanced"},
            {"skill": "Cryptography", "min_level": "beginner"}
        ]
    },
    {
        "role_name": "Blockchain / Web3 Engineer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Solidity", "min_level": "advanced"},
            {"skill": "TypeScript", "min_level": "intermediate"},
            {"skill": "Ethereum/EVM", "min_level": "advanced"},
            {"skill": "Cryptography", "min_level": "intermediate"},
            {"skill": "Smart Contract Auditing", "min_level": "intermediate"},
            {"skill": "Web3.js/Ethers.js", "min_level": "advanced"}
        ]
    },
    {
        "role_name": "Applied ML / Data Scientist (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "Python", "min_level": "advanced"},
            {"skill": "Scikit-Learn", "min_level": "advanced"},
            {"skill": "TensorFlow/PyTorch", "min_level": "intermediate"},
            {"skill": "SQL", "min_level": "advanced"},
            {"skill": "Statistics", "min_level": "advanced"},
            {"skill": "Data Visualization", "min_level": "intermediate"},
            {"skill": "MLOps", "min_level": "beginner"}
        ]
    },
    {
        "role_name": "AR / VR Developer (2026)",
        "source": "2026 Industry Standard",
        "required_skills": [
            {"skill": "C#", "min_level": "advanced"},
            {"skill": "Unity / Unreal Engine", "min_level": "advanced"},
            {"skill": "3D Math", "min_level": "intermediate"},
            {"skill": "Spatial Computing", "min_level": "intermediate"},
            {"skill": "C++", "min_level": "intermediate"}
        ]
    }
]

def seed_db():
    db = SessionLocal()
    try:
        added_roles = 0
        for r_data in roles_data:
            existing = db.query(RoleSkillMap).filter(RoleSkillMap.role_name == r_data["role_name"]).first()
            if existing:
                print(f"Role '{r_data['role_name']}' already exists, skipping.")
                continue
            
            new_role = RoleSkillMap(
                role_name=r_data["role_name"],
                source=r_data["source"],
                required_skills=r_data["required_skills"]
            )
            db.add(new_role)
            added_roles += 1
            print(f"Added role '{r_data['role_name']}'.")
        
        if added_roles > 0:
            db.commit()
            print(f"Successfully committed {added_roles} new roles to the database.")
        else:
            print("No new roles were added.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
