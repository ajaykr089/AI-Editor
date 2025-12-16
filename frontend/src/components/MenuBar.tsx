type MenuItem = {
  label: string;
  action?: () => void;
};

type Menu = {
  label: string;
  items: MenuItem[];
};

type Props = {
  menus: Menu[];
};

const MenuBar = ({ menus }: Props) => {
  return (
    <nav className="menu-bar">
      {menus.map((menu) => (
        <div className="menu" key={menu.label}>
          <span className="menu-label">{menu.label}</span>
          <div className="menu-dropdown">
            {menu.items.map((item) => (
              <button key={item.label} onClick={item.action} className="menu-item">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default MenuBar;

