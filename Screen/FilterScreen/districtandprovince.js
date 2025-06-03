export const vietnamCities = [
  {
    id: 1,
    name: "Hồ Chí Minh",
    code: "HCM",
    districts: [
      { id: 101, name: "Quận 1", code: "Q1" },
      { id: 102, name: "Quận 2", code: "Q2" },
      { id: 103, name: "Quận 3", code: "Q3" },
      { id: 104, name: "Quận 4", code: "Q4" },
      { id: 105, name: "Quận 5", code: "Q5" },
      { id: 106, name: "Quận 6", code: "Q6" },
      { id: 107, name: "Quận 7", code: "Q7" },
      { id: 108, name: "Quận 8", code: "Q8" },
      { id: 109, name: "Quận 9", code: "Q9" },
      { id: 110, name: "Quận 10", code: "Q10" },
      { id: 111, name: "Quận 11", code: "Q11" },
      { id: 112, name: "Quận 12", code: "Q12" },
      { id: 113, name: "Quận Bình Thạnh", code: "BT" },
      { id: 114, name: "Quận Gò Vấp", code: "GV" },
      { id: 115, name: "Quận Phú Nhuận", code: "PN" },
      { id: 116, name: "Quận Tân Bình", code: "TB" },
      { id: 117, name: "Quận Tân Phú", code: "TP" },
      { id: 118, name: "Quận Thủ Đức", code: "TD" },
      { id: 119, name: "Huyện Bình Chánh", code: "BC" },
      { id: 120, name: "Huyện Cần Giờ", code: "CG" },
      { id: 121, name: "Huyện Củ Chi", code: "CC" },
      { id: 122, name: "Huyện Hóc Môn", code: "HM" },
      { id: 123, name: "Huyện Nhà Bè", code: "NB" }
    ]
  },
  {
    id: 2,
    name: "Hà Nội",
    code: "HN",
    districts: [
      { id: 201, name: "Quận Ba Đình", code: "BD" },
      { id: 202, name: "Quận Hoàn Kiếm", code: "HK" },
      { id: 203, name: "Quận Tây Hồ", code: "TH" },
      { id: 204, name: "Quận Long Biên", code: "LB" },
      { id: 205, name: "Quận Cầu Giấy", code: "CG" },
      { id: 206, name: "Quận Đống Đa", code: "DD" },
      { id: 207, name: "Quận Hai Bà Trưng", code: "HBT" },
      { id: 208, name: "Quận Hoàng Mai", code: "HM" },
      { id: 209, name: "Quận Thanh Xuân", code: "TX" },
      { id: 210, name: "Quận Nam Từ Liêm", code: "NTL" },
      { id: 211, name: "Quận Bắc Từ Liêm", code: "BTL" },
      { id: 212, name: "Quận Hà Đông", code: "HD" },
      { id: 213, name: "Huyện Ba Vì", code: "BV" },
      { id: 214, name: "Huyện Chương Mỹ", code: "CM" },
      { id: 215, name: "Huyện Đan Phượng", code: "DP" },
      { id: 216, name: "Huyện Đông Anh", code: "DA" },
      { id: 217, name: "Huyện Gia Lâm", code: "GL" },
      { id: 218, name: "Huyện Hoài Đức", code: "HDC" },
      { id: 219, name: "Huyện Mê Linh", code: "ML" },
      { id: 220, name: "Huyện Mỹ Đức", code: "MD" },
      { id: 221, name: "Huyện Phú Xuyên", code: "PX" },
      { id: 222, name: "Huyện Phúc Thọ", code: "PT" },
      { id: 223, name: "Huyện Quốc Oai", code: "QO" },
      { id: 224, name: "Huyện Sóc Sơn", code: "SS" },
      { id: 225, name: "Huyện Thạch Thất", code: "TT" },
      { id: 226, name: "Huyện Thanh Oai", code: "TO" },
      { id: 227, name: "Huyện Thường Tín", code: "TTN" },
      { id: 228, name: "Huyện Ứng Hòa", code: "UH" },
      { id: 229, name: "Thị xã Sơn Tây", code: "ST" }
    ]
  }
];

// Helper functions
export const getCityById = (cityId) => {
  return vietnamCities.find(city => city.id === cityId);
};

export const getDistrictById = (cityId, districtId) => {
  const city = getCityById(cityId);
  return city?.districts.find(district => district.id === districtId);
};

export const getDistrictsByCity = (cityId) => {
  const city = getCityById(cityId);
  return city?.districts || [];
};

export const getAllCities = () => {
  return vietnamCities.map(city => ({
    id: city.id,
    name: city.name,
    code: city.code
  }));
};

export default vietnamCities;