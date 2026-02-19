"""
Management command: seed_demo
Creates/resets the demo user (demo/demo) with realistic test data.

Usage:
    python manage.py seed_demo            # Create or reset demo data
    python manage.py seed_demo --reset    # Delete all demo data first, then reseed
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from checklist.models import (
    TodoList, Task,
    GForm, GQuestion, GOption, GResponse, GAnswer, GSelectedOption,
)


DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo"
DEMO_EMAIL = "demo@dragtask.app"


class Command(BaseCommand):
    help = "Creates the demo/demo user and seeds it with sample data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing demo data before seeding.",
        )

    def handle(self, *args, **options):
        # ── 1. Create or fetch demo user ──────────────────────────────────────
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL, "is_staff": False, "is_superuser": False},
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        verb = "Created" if created else "Found existing"
        self.stdout.write(self.style.SUCCESS(f"{verb} user '{DEMO_USERNAME}'"))

        # ── 2. Optionally wipe previous demo data ─────────────────────────────
        if options["reset"]:
            TodoList.objects.filter(user=user).delete()
            GForm.objects.filter(user=user).delete()
            self.stdout.write(self.style.WARNING("Deleted previous demo data."))

        # Skip if data already exists and --reset was not requested
        if not options["reset"] and TodoList.objects.filter(user=user).exists():
            self.stdout.write(
                self.style.WARNING(
                    "Demo data already exists. Run with --reset to regenerate."
                )
            )
            return

        now = timezone.now()

        # ── 3. Todo Lists ──────────────────────────────────────────────────────
        self._seed_todo_lists(user, now)

        # ── 4. Dynamic Forms ──────────────────────────────────────────────────
        self._seed_gforms(user, now)

        self.stdout.write(
            self.style.SUCCESS("✓ Demo data seeded successfully for user 'demo'.")
        )

    # ── Todo Lists ─────────────────────────────────────────────────────────────

    def _seed_todo_lists(self, user, now):
        # List 1: Work Sprint (mixed states, has progress)
        list1 = TodoList.objects.create(
            user=user,
            name="🚀 Work Sprint – Q1",
            created_at=now - timedelta(days=5),
        )
        tasks1 = [
            ("Design new landing page",    "done",     "Create wireframes and mockups for the redesigned homepage.", 0, now - timedelta(days=3)),
            ("Set up CI/CD pipeline",       "done",     "Configure GitHub Actions for automated testing and deployment.", 1, now - timedelta(days=2)),
            ("Write API documentation",     "progress", "Document all REST endpoints with examples using Swagger.", 2, now + timedelta(days=2)),
            ("Fix authentication bug",      "progress", "Token expiry not being handled correctly on mobile clients.", 3, now + timedelta(days=1)),
            ("Code review – PR #42",        "todo",     "Review pull request for the new notification system.", 4, now + timedelta(days=3)),
            ("Deploy to staging",           "todo",     "Run smoke tests on staging environment before prod push.", 5, now + timedelta(days=4)),
            ("Update dependencies",         "todo",     "Bump major package versions and resolve breaking changes.", 6, None),
        ]
        for title, status, desc, pos, due in tasks1:
            Task.objects.create(
                todo_list=list1, title=title, status=status,
                description=desc, position=pos, due_date=due,
            )

        # List 2: Personal Goals (mostly done)
        list2 = TodoList.objects.create(
            user=user,
            name="🎯 Personal Goals",
            created_at=now - timedelta(days=12),
        )
        tasks2 = [
            ("Read 'Clean Code'",           "done",     "Finish the book and take summary notes.", 0, None),
            ("30-day exercise streak",      "done",     "At least 20 minutes of activity every day.", 1, None),
            ("Learn Django REST Framework", "done",     "Complete the official tutorial and build a sample API.", 2, None),
            ("Build portfolio site",        "progress", "Design and publish personal portfolio with 3 case studies.", 3, now + timedelta(days=7)),
            ("Spanish B2 certificate",      "todo",     "Register for the DELE B2 exam in June.", 4, now + timedelta(days=30)),
        ]
        for title, status, desc, pos, due in tasks2:
            Task.objects.create(
                todo_list=list2, title=title, status=status,
                description=desc, position=pos, due_date=due,
            )

        # List 3: Shopping / Errands (all todo)
        list3 = TodoList.objects.create(
            user=user,
            name="🛒 Errands",
            created_at=now - timedelta(days=1),
        )
        tasks3 = [
            ("Buy groceries",               "todo", "Milk, eggs, bread, fruit.", 0, now + timedelta(days=1)),
            ("Pick up dry cleaning",        "todo", None, 1, now + timedelta(days=2)),
            ("Schedule dentist appointment","todo", None, 2, None),
            ("Pay internet bill",           "todo", None, 3, now + timedelta(days=5)),
        ]
        for title, status, desc, pos, due in tasks3:
            Task.objects.create(
                todo_list=list3, title=title, status=status,
                description=desc, position=pos, due_date=due,
            )

        self.stdout.write(f"  + Created 3 Todo Lists with {sum([len(tasks1), len(tasks2), len(tasks3)])} tasks")

    # ── GForms ────────────────────────────────────────────────────────────────

    def _seed_gforms(self, user, now):
        # ── Form 1: Employee Satisfaction Survey (published, has responses) ───
        form1 = GForm.objects.create(
            user=user,
            title="Employee Satisfaction Survey",
            description="Quick anonymous check-in about your work experience this quarter.",
            is_published=True,
        )

        q1 = GQuestion.objects.create(
            form=form1, position=0,
            text="How satisfied are you with your current role?",
            question_type="linear_scale", is_required=True,
            min_value=1, max_value=5,
            min_label="Very Unsatisfied", max_label="Very Satisfied",
        )
        q2 = GQuestion.objects.create(
            form=form1, position=1,
            text="Which areas do you think need the most improvement?",
            question_type="checkbox", is_required=True,
        )
        q2_opts = ["Work-life balance", "Team communication", "Tooling & tech stack", "Career growth", "Compensation"]
        q2_option_objs = [GOption.objects.create(question=q2, text=t, position=i) for i, t in enumerate(q2_opts)]

        q3 = GQuestion.objects.create(
            form=form1, position=2,
            text="How would you describe your team's collaboration?",
            question_type="multiple_choice", is_required=False,
        )
        q3_opts = ["Excellent", "Good", "Average", "Needs improvement"]
        q3_option_objs = [GOption.objects.create(question=q3, text=t, position=i) for i, t in enumerate(q3_opts)]

        q4 = GQuestion.objects.create(
            form=form1, position=3,
            text="What's one thing that would make your job better?",
            question_type="paragraph", is_required=False,
        )

        # Seed 4 responses
        sample_responses = [
            {
                "q1": "4",
                "q2_indices": [0, 2],
                "q3_index": 1,
                "q4": "More async communication and fewer meetings.",
            },
            {
                "q1": "3",
                "q2_indices": [1, 3],
                "q3_index": 2,
                "q4": "Better onboarding documentation.",
            },
            {
                "q1": "5",
                "q2_indices": [4],
                "q3_index": 0,
                "q4": "Nothing comes to mind — things are great!",
            },
            {
                "q1": "2",
                "q2_indices": [0, 1, 3],
                "q3_index": 3,
                "q4": "Clearer goals and more frequent 1-on-1s with managers.",
            },
        ]

        for i, r in enumerate(sample_responses):
            response = GResponse.objects.create(
                form=form1,
                respondent=None,
                respondent_email=f"respondent{i + 1}@example.com",
                created_at=now - timedelta(days=i),
            )
            # q1 linear scale
            GAnswer.objects.create(response=response, question=q1, text_answer=r["q1"])
            # q2 checkboxes
            ans2 = GAnswer.objects.create(response=response, question=q2)
            for idx in r["q2_indices"]:
                GSelectedOption.objects.create(answer=ans2, option=q2_option_objs[idx])
            # q3 multiple choice
            ans3 = GAnswer.objects.create(response=response, question=q3)
            GSelectedOption.objects.create(answer=ans3, option=q3_option_objs[r["q3_index"]])
            # q4 paragraph
            GAnswer.objects.create(response=response, question=q4, text_answer=r["q4"])

        # ── Form 2: Event Feedback (draft, no responses) ───────────────────────
        form2 = GForm.objects.create(
            user=user,
            title="Tech Talk Feedback – March Edition",
            description="Let us know what you thought about this month's tech talk.",
            is_published=False,
        )
        GQuestion.objects.create(
            form=form2, position=0,
            text="How would you rate the presentation overall?",
            question_type="linear_scale", is_required=True,
            min_value=1, max_value=5,
            min_label="Poor", max_label="Excellent",
        )
        q_topic = GQuestion.objects.create(
            form=form2, position=1,
            text="Which topic did you find most valuable?",
            question_type="multiple_choice", is_required=False,
        )
        for i, t in enumerate(["System design patterns", "Performance optimization", "Security best practices", "New framework features"]):
            GOption.objects.create(question=q_topic, text=t, position=i)
        GQuestion.objects.create(
            form=form2, position=2,
            text="What topics would you like to see covered next time?",
            question_type="short_text", is_required=False,
        )

        self.stdout.write(
            f"  + Created 2 GForms (1 published with {len(sample_responses)} responses, 1 draft)"
        )
