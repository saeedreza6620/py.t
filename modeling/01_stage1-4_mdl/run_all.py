"""Reproduce every number and figure:  python run_all.py <folder containing the original PDFs>"""
import subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__)); code = os.path.join(here, "code")
src = sys.argv[1] if len(sys.argv) > 1 else "."
steps = [["stage1_verification.py"],
         ["digitize_saravanan2011.py", src, os.path.join(here, "data", "digitization", "saravanan2011_fig6_vector.csv")],
         ["build_dataset.py", src], ["qa_overlay.py", src],
         ["stage2_fit.py"], ["stage2_plots.py"], ["stage3_readiness.py"], ["stage4_compare.py"]]
for s in steps:
    print(">>", " ".join(s), flush=True)
    subprocess.run([sys.executable, s[0], *s[1:]], cwd=code, check=True)
