const fs = require('fs');
const path = require('path');
const { logger } = require('@librechat/data-schemas');

/**
 * Simple INI-style config file parser
 * company_profile.cfg 파일을 파싱하는 유틸리티
 */
class ConfigParser {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = {};
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.warn(`Config file not found: ${this.configPath}`);
        return;
      }

      const content = fs.readFileSync(this.configPath, 'utf8');
      this.parseContent(content);
      logger.info('Company profile config loaded successfully');
    } catch (error) {
      logger.error('Error loading config file:', error);
    }
  }

  parseContent(content) {
    const lines = content.split('\n');
    let currentSection = null;

    for (let line of lines) {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Section headers [SectionName]
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1).toLowerCase();
        this.config[currentSection] = {};
        continue;
      }

      // Key-value pairs
      if (currentSection && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (currentSection === 'teams') {
          // Parse comma-separated team lists
          this.config[currentSection][key.trim()] = value.split(',').map(t => t.trim());
        } else {
          this.config[currentSection][key.trim()] = value;
        }
      }
    }
  }

  getCompanyInfo() {
    return this.config.company || {};
  }

  getDivisions() {
    const divisions = this.config.divisions || {};
    return Object.keys(divisions);
  }

  getDivisionDisplayNames() {
    return this.config.divisions || {};
  }

  getTeamsByDivision(divisionKey) {
    return this.config.teams?.[divisionKey] || [];
  }

  getAllTeams() {
    const allTeams = {};
    const teams = this.config.teams || {};
    
    for (const [division, teamList] of Object.entries(teams)) {
      allTeams[division] = teamList;
    }
    
    return allTeams;
  }

  getSettings() {
    return this.config.settings || {};
  }

  // Helper method to validate division
  isValidDivision(divisionKey) {
    return this.getDivisions().includes(divisionKey);
  }

  // Helper method to validate team for a division
  isValidTeam(divisionKey, teamName) {
    const teams = this.getTeamsByDivision(divisionKey);
    return teams.includes(teamName);
  }

  // Reload config file (useful for dynamic updates)
  reload() {
    this.config = {};
    this.loadConfig();
  }
}

// Create singleton instance
const configPath = path.join(__dirname, 'company_profile.cfg');
const configParser = new ConfigParser(configPath);

module.exports = configParser;