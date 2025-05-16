function DatasetCard(id: number, title: string, description: string) {
  return <div style={{
      display: "flex", 
      flexDirection: "column", 
      gap: 5, 
      backgroundColor: "var(--color-light-7)",
      color: "var(--color-light-0)",
      padding: "10px", 
      borderRadius: "10px"
    }}>
      <img src="" alt="" style={{width: 160, height: 160}}/>
      <div style={{fontWeight: "bold"}}>
        {title}
      </div>
      <div>
        {description}
      </div>
    </div>
}

export default DatasetCard