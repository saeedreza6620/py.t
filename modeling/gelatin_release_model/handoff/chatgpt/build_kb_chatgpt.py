"""Concatenate the hand-off docs, project notes and core code into one file Grok can ingest."""
from pathlib import Path

H = Path('/home/claude/handoff/ChatGPT_Handoff')
G = H / 'repo_snapshot' / 'gelatin_release_model'
out = H / 'CHATGPT_KNOWLEDGE_BASE.md'

docs = ['01_CHATGPT_MASTER_PROMPT.md', '12_USER_AND_COLLABORATION.md', '02_PROJECT_STATE.md',
        '11_SIMULATION_HISTORY_AND_NOTES.md', '07_RULES_AND_QUALITY.md', '09_WRITING_STYLE_GUIDE.md',
        '10_LITERATURE_REVIEW_GUIDE.md', '03_TECHNICAL_ROADMAP.md', '04_ML_PLAN.md',
        '13_MISSION_COMPLETE_MODEL_HTML.md', '05_PRODUCT_STRATEGY.md', '06_MARKETING_GTM.md',
        '08_TASK_PROMPTS.md', 'LINKS.txt']
repo_docs = ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'results/VALIDATION.md', 'results/summary.json']
code = sorted((G / 'grm').glob('*.py')) + sorted((G / 'validation').glob('*.py')) + \
       sorted((G / 'tests').glob('*.py')) + [G / 'ml/build_training_table.py', G / 'simulator/build_simulator.py',
                                            G / 'tools/digitize_cheng2010.py', G / 'requirements.txt']
data = sorted((G / 'data').glob('*.csv')) + [G / 'ml/formulations.csv']
notes = sorted((H / 'project_notes').glob('*.md'))

fence = {'.py': 'python', '.json': 'json', '.csv': 'csv', '.html': 'html', '.txt': 'text', '.md': 'markdown'}


def block(title, path):
    text = Path(path).read_text(encoding='utf-8')
    lang = fence.get(Path(path).suffix, '')
    if Path(path).suffix == '.md' and 'repo' not in title:
        return f'\n\n<!-- ===== {title} ===== -->\n\n# FILE: {title}\n\n{text}\n'
    return f'\n\n# FILE: {title}\n\n````{lang}\n{text}\n````\n'


parts = ['# CHATGPT KNOWLEDGE BASE — GRM (gelatin release model) project, complete context\n\n'
         'Generated 12 Nov 2026 from the hand-off ZIP (ChatGPT_Handoff.zip). Everything the previous assistant knew is here: '
         'instructions, user profile and decision log, project state, full simulation history, rules, writing style, '
         'literature-review guide, roadmap, the MISSION (section 13), product and marketing, repository docs, '
         'all core code, all data, and per-stage notes. The latest literature review (Persian) is in '
         '`thesis_docs/markdown/` of the ZIP (too long to inline). The simulator template is in '
         '`repo_snapshot/gelatin_release_model/simulator/template.html`.\n\n## Table of contents\n']
toc = [d for d in docs] + ['repo/' + d for d in repo_docs] + ['code/' + str(p.relative_to(G)) for p in code] + \
      ['data/' + str(p.relative_to(G)) for p in data] + ['notes/' + p.name for p in notes]
parts.append('\n'.join(f'{i+1}. {t}' for i, t in enumerate(toc)) + '\n')
for d in docs:
    parts.append(block(d, H / d))
for d in repo_docs:
    parts.append(block('repo/' + d, G / d))
for p in code:
    parts.append(block('code/' + str(p.relative_to(G)), p))
for p in data:
    parts.append(block('data/' + str(p.relative_to(G)), p))
for p in notes:
    parts.append(block('notes/' + p.name, p))
out.write_text(''.join(parts), encoding='utf-8')
print(out, out.stat().st_size)
