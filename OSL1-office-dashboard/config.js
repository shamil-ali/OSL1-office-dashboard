
window.DASHBOARD_CONFIG = {
  title: "OSL1 Office Dashboard",
  bullbat: {
    title: "Bullbat Alerts",
    url: "http://45.78.209.86:62401/ticket-hub/list",
    refreshMinutes: 2
  },

  rightPanels: [
    { id: "handover", label: "Handover", url: "https://docs.google.com/document/d/1Qk2EOQcU2dj6pVBFVSy_RwSFj8xfgzBkWan1TH24MSk/edit?rm=minimal", refreshMinutes: 0 },
    { id: "visitors", label: "Visitor Access", url: "https://docs.google.com/spreadsheets/d/12tct8yLyvreL8V2uqRT3Kgk4Z3L8wBIcaGmjBHJMrxs/edit?rm=minimal", refreshMinutes: 0 },
    { id: "deliveries", label: "Delivery Tracking", url: "https://docs.google.com/spreadsheets/d/1dOZrLsETgvDYqPs_eEtMDW0UINaxVvJmKxETz256LMI/edit?rm=minimal", refreshMinutes: 0 }
  ],
  autoRotateRight: true,
  rotateSeconds: 20,
};
