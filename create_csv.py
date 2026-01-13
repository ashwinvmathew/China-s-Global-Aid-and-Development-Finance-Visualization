import pandas as pd

# Load Excel
df = pd.read_excel("data/data.xlsx")

print("Rows before filtering:", len(df))

# Clean Flow Type
df["Flow Type"] = df["Flow Type"].astype(str).str.strip()

# Keep only Grant and Loan
df = df[df["Flow Type"].isin(["Grant", "Loan"])]

print("Rows after Flow Type filter:", len(df))

# Map to ODA / OOF
df["Flow Type"] = df["Flow Type"].map({
    "Grant": "ODA",
    "Loan": "OOF"
})

# Keep required columns ONLY
df = df[[
    "Recipient ISO-3",
    "Flow Type"
]]

# Drop missing country codes
df = df.dropna()

# Save CSV
df.to_csv("data/aiddata.csv", index=False)

print("✅ aiddata.csv created successfully")
print("Final rows:", len(df))
print(df.head())
