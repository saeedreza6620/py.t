#!/usr/bin/env bash
# Many scripts have absolute paths from the original build machine (/home/claude/...).
# This script recreates those paths as symlinks into this repo. Run once: bash link_original_paths.sh
set -e
R="$(cd "$(dirname "$0")" && pwd)"
mkdir -p /home/claude
ln -sfn "$R/01_stage1-4_mdl"          /home/claude/mdl
ln -sfn "$R/02_abdekhodaie2006"       /home/claude/Abd06_sync
ln -sfn "$R/03_degradation_doe_kodra" /home/claude/Deg_DOE
ln -sfn "$R/04_gelatin_routes"        /home/claude/Gelatin_routes
ln -sfn "$R/05_gelatin_design"        /home/claude/Gelatin_design
ln -sfn "$R/06_model_completion"      /home/claude/Model_completion
ln -sfn "$R/07_plga/PLGA_step1"       /home/claude/PLGA_step1
ln -sfn "$R/07_plga/PLGA_databank"    /home/claude/PLGA_databank
echo "done: /home/claude/* now point into $R"
