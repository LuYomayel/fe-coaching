import './LogoLoader.css';

const LogoLoader = ({ size = 'medium', className = '' }) => {
  // Definir tamaños predefinidos
  const sizeMap = {
    small: '50px',
    medium: '100px',
    large: '150px'
  };

  // Obtener el tamaño del logo
  const logoSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;

  return (
    <div className={`logo-loader-container ${className}`}>
      <div className="logo-loader" style={{ width: logoSize, height: logoSize }}>
        <img src="/logo512.png" alt="Logo" className="logo-image" />
      </div>
    </div>
  );
};

export default LogoLoader;
