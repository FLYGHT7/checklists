# Issue #6 — Add Question Type: Pass / Fail / N/A

**Branch:** `feat/issue-6-pass-fail-na`  
**Date:** 2026-04-13  
**Closes:** #6  
**Status:** ⏳ Awaiting approval

---

## 1. Problem Statement

The app currently offers 8 question types (Short Text, Paragraph, Multiple Choice, Checkboxes, Dropdown, Linear Scale, Date, Time). The core use-case of the app — running checklists — almost always needs a **Pass / Fail / N/A** judgment. Users must currently create a Manual Choice question with 3 options, which is tedious and visually plain.

A dedicated `pass_fail` question type should:
- Appear as a single compact row (as the issue specifically requests)
- Be visually color-coded (green / red / grey) for instant scanability
- Require zero setup from the form creator — the 3 options are fixed

---

## 2. Design Decision

**Approach: Styled segmented button group (pure CSS + hidden radio inputs)**

Chosen over inline radios and dropdown because:
- Matches the reference image in the issue exactly
- Compact — one line, no label clutter
- Color-coded: Pass = green, Fail = red, N/A = grey
- Consistent with the pill/badge design language already in the app (`stat-pill`, `status-badge` in dashboard cards)
- No JavaScript required — CSS `:checked` pseudo-class handles active state

**Response form render:**

```
┌─────────────────────────────────────────────────┐
│ Is the title of the chart on the layout correct? │
│                                                   │
│  [ ✓ Pass ]   [ ✗ Fail ]   [ — N/A ]            │
│   (green)      (red)        (grey)               │
└─────────────────────────────────────────────────┘
```

Active button fills with its color. Inactive buttons are outlined.

---

## 3. Architecture

### 3.1 Data model

No new model or migration is needed for options — the 3 choices are fixed constants.

**Change:** Add `pass_fail` to `QUESTION_TYPES` on both `GQuestion` and `BankQuestion`:

```python
('pass_fail', 'Pass / Fail / N/A'),
```

**Answer storage:** The selected value (`"pass"`, `"fail"`, or `"na"`) is stored in the existing `GAnswer.text_answer` field — the same as `linear_scale`, `date`, `time`. No schema change required.

**Migration:** One migration to update the `choices` kwarg on the `question_type` CharField on both models (Django validates choices at the Python level; the DB column is just a varchar — no structural change, but a migration is needed to keep the migration history in sync).

### 3.2 Translation

Add to `translation.py` → `TRANSLATIONS_ES`:

| English | Spanish |
|---|---|
| `"Pass / Fail / N/A"` | `"Aprobado / Reprobado / N/A"` |
| `"Pass"` | `"Aprobado"` |
| `"Fail"` | `"Reprobado"` |
| `"N/A"` | `"N/A"` |

### 3.3 Forms (`checklist/forms.py`)

- Add `"pass_fail"` to the translated choices list in `GQuestionForm.__init__`
- `GFormResponseForm`: Add `pass_fail` branch that renders a `ChoiceField` with the 3 fixed choices `[("pass","Pass"),("fail","Fail"),("na","N/A")]`. The widget is `forms.RadioSelect` (hidden via CSS; labels become the styled buttons).

### 3.4 Response view (`checklist/views.py`)

In `gform_respond()`, the answer-saving loop already handles any type that stores in `text_answer`. The `pass_fail` type follows the same branch as `short_text` / `linear_scale` — **no view change required**.

### 3.5 Response template (`respond_form.html`)

Add a new `{% elif question.question_type == "pass_fail" %}` block:

```html
<div class="pass-fail-group" role="group">
  <input type="radio" id="pf_pass_{{ question.id }}"
         class="pass-fail-input" name="question_{{ question.id }}"
         value="pass" {% if question.is_required %}required{% endif %}>
  <label for="pf_pass_{{ question.id }}" class="pass-fail-btn pass-btn">
    <i class="bi bi-check-lg"></i> {% trans_tag "Pass" %}
  </label>

  <input type="radio" id="pf_fail_{{ question.id }}"
         class="pass-fail-input" name="question_{{ question.id }}"
         value="fail">
  <label for="pf_fail_{{ question.id }}" class="pass-fail-btn fail-btn">
    <i class="bi bi-x-lg"></i> {% trans_tag "Fail" %}
  </label>

  <input type="radio" id="pf_na_{{ question.id }}"
         class="pass-fail-input" name="question_{{ question.id }}"
         value="na">
  <label for="pf_na_{{ question.id }}" class="pass-fail-btn na-btn">
    <i class="bi bi-dash"></i> {% trans_tag "N/A" %}
  </label>
</div>
```

### 3.6 CSS (`forms_google.css`)

New rules for `.pass-fail-group`, `.pass-fail-input` (hidden), `.pass-fail-btn` (base), `.pass-btn`, `.fail-btn`, `.na-btn`, and their `:checked + label` active states. Dark mode variants included.

### 3.7 Response detail template (`view_responses.html` or `response_detail.html`)

When displaying a saved `pass_fail` answer, render a color-coded badge instead of plain text:
- `"pass"` → green badge `✓ Pass`
- `"fail"` → red badge `✗ Fail`
- `"na"` → grey badge `— N/A`

### 3.8 Edit form / Question bank

- `edit_form.html`: The linear-scale-specific fields are hidden for `pass_fail` (same as all non-linear_scale types — the existing JS already handles this)
- Question bank shows `pass_fail` type display label correctly via `question_type_display` (Django's `get_FOO_display()`)
- No options panel needed — `pass_fail` has no user-configurable options, so the "Add option" button should be hidden when this type is selected (1-line JS change)

---

## 4. Files to Change

| File | Change |
|---|---|
| `checklist/models.py` | Add `('pass_fail', 'Pass / Fail / N/A')` to `GQuestion.QUESTION_TYPES` and `BankQuestion.QUESTION_TYPES` |
| `checklist/migrations/0023_*.py` | Auto-generated migration (choices update) |
| `checklist/translation.py` | 4 new EN→ES entries |
| `checklist/forms.py` | Add `pass_fail` to translated choices in `GQuestionForm`; add `pass_fail` branch in `GFormResponseForm` |
| `checklist/views.py` | No change needed |
| `checklist/templates/forms_google/respond_form.html` | Add `{% elif question.question_type == "pass_fail" %}` render block |
| `checklist/templates/forms_google/response_detail.html` | Add colored badge display for `pass_fail` answers |
| `checklist/static/css/forms_google.css` | Add `.pass-fail-group` and button styles |
| `checklist/static/js/edit_form.js` | Hide "Add option" button when `pass_fail` selected |

---

## 5. What Is Explicitly Out of Scope

- No changes to `GAnswer` model — `text_answer` is sufficient
- No changes to `gform_respond()` view — existing `text_answer` path handles it
- No Excel export changes (the raw value `"pass"/"fail"/"na"` is fine as-is)
- No question bank special handling beyond what already exists for all types

---

## 6. Verification Checklist

- [ ] `python manage.py makemigrations --check` shows only the choices migration
- [ ] `python manage.py check` — 0 issues
- [ ] Pass/Fail/N/A appears in the question type dropdown in the edit form
- [ ] Response form renders the 3 pill buttons in one row
- [ ] Selecting a button highlights it with the correct color
- [ ] Submitting a response saves `"pass"`, `"fail"`, or `"na"` in `text_answer`
- [ ] Response detail view shows a colored badge
- [ ] "Add option" button is hidden when pass_fail type is selected
- [ ] Spanish translation renders correctly when language = `es`
