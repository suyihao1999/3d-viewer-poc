import { useState } from 'react';
import './App.css';
import FloorPlanViewer from './components/FloorPlanViewer';

type FloorItem = {
  component: string;
  floor: number;
  position: { x: number; y: number };
  size: { x: number; y: number };
};

type NewItemForm = {
  component: string;
  floor: string;
  positionX: string;
  positionY: string;
  sizeX: string;
  sizeY: string;
};

const initialNewItemForm: NewItemForm = {
  component: '',
  floor: '0',
  positionX: '0',
  positionY: '0',
  sizeX: '1',
  sizeY: '1',
};

const getTestItems = (floor: number, from: number, to: number, size: number): FloorItem[] => {
  const items: FloorItem[] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      items.push({
        component: `Conference`,
        floor: floor,
        position: {
          x: from + (i * (to - from)) / 10 + Math.random() * 0.01,
          y: from + (j * (to - from)) / 10 + Math.random() * 0.01,
        },
        size: { x: size, y: size },
      });
    }
  }
  return items;
};

function generateSampleItems(): FloorItem[] {
  let items: FloorItem[] = [];
  items.push({
    component: 'Elevator',
    floor: 0,
    position: { x: -11, y: -11 },
    size: { x: 22, y: 22 },
  });

  items = items.concat(getTestItems(1, -10, 10, 1));

  items.push({
    component: 'Elevator',
    floor: 2,
    position: { x: -8, y: -8 },
    size: { x: 16, y: 16 },
  });

  items = items.concat(getTestItems(3, -7, 7, 0.7));

  items.push({
    component: 'Elevator',
    floor: 4,
    position: { x: -6, y: -6 },
    size: { x: 12, y: 12 },
  });

  items = items.concat(getTestItems(5, -5, 5, 0.7));

  return items;
}

function App() {
  const [items, setItems] = useState<FloorItem[]>(() => generateSampleItems());
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [newItemForm, setNewItemForm] = useState<NewItemForm>(initialNewItemForm);

  // 提取唯一的 components 和 floors
  const uniqueComponents = Array.from(new Set(items.map((item) => item.component))).sort();
  const uniqueFloors = Array.from(new Set(items.map((item) => item.floor))).sort((a, b) => a - b);

  // Filter state
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set(uniqueComponents),
  );
  const [selectedFloors, setSelectedFloors] = useState<Set<number>>(new Set(uniqueFloors));

  // 篩選後的 items
  const filteredItems = items.filter(
    (item) => selectedComponents.has(item.component) && selectedFloors.has(item.floor),
  );

  // 當 highlight index 超出篩選後的範圍時，重置
  const validHighlightIndex =
    highlightIndex !== null && highlightIndex < filteredItems.length ? highlightIndex : null;

  const handleComponentToggle = (component: string) => {
    const newSet = new Set(selectedComponents);
    if (newSet.has(component)) {
      newSet.delete(component);
    } else {
      newSet.add(component);
    }
    setSelectedComponents(newSet);
  };

  const handleFloorToggle = (floor: number) => {
    const newSet = new Set(selectedFloors);
    if (newSet.has(floor)) {
      newSet.delete(floor);
    } else {
      newSet.add(floor);
    }
    setSelectedFloors(newSet);
  };

  const updateNewItemForm = (field: keyof NewItemForm, value: string) => {
    setNewItemForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleAddItem = () => {
    const component = newItemForm.component.trim();
    const floor = Number(newItemForm.floor);
    const positionX = Number(newItemForm.positionX);
    const positionY = Number(newItemForm.positionY);
    const sizeX = Number(newItemForm.sizeX);
    const sizeY = Number(newItemForm.sizeY);

    if (
      component.length === 0 ||
      !Number.isFinite(floor) ||
      !Number.isFinite(positionX) ||
      !Number.isFinite(positionY) ||
      !Number.isFinite(sizeX) ||
      !Number.isFinite(sizeY) ||
      sizeX <= 0 ||
      sizeY <= 0
    ) {
      return;
    }

    const newItem: FloorItem = {
      component,
      floor,
      position: { x: positionX, y: positionY },
      size: { x: sizeX, y: sizeY },
    };

    setItems((currentItems) => [...currentItems, newItem]);
    setSelectedComponents((currentComponents) => new Set(currentComponents).add(component));
    setSelectedFloors((currentFloors) => new Set(currentFloors).add(floor));
    setNewItemForm(initialNewItemForm);
  };

  return (
    <div className="app-shell">
      <div className="viewer-with-filter">
        <main className="viewer-card">
          <FloorPlanViewer
            items={filteredItems}
            highlightIndex={validHighlightIndex}
            onSelectItem={setHighlightIndex}
          />
        </main>
        <aside className="filter-panel">
          <div className="filter-section">
            <div className="filter-options">
              {uniqueComponents.map((component) => (
                <label key={component} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedComponents.has(component)}
                    onChange={() => handleComponentToggle(component)}
                  />
                  <span>{component}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <div className="filter-options">
              {uniqueFloors.map((floor) => (
                <label key={floor} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedFloors.has(floor)}
                    onChange={() => handleFloorToggle(floor)}
                  />
                  <span>Floor {floor}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-info">
            <p>
              Showing {filteredItems.length} of {items.length} items
            </p>
          </div>
        </aside>
      </div>
      <section className="items-table-section">
        <h2>Floor Plan Items</h2>
        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Component</th>
                <th>Floor</th>
                <th>Position X</th>
                <th>Position Y</th>
                <th>Size X</th>
                <th>Size Y</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr
                  key={`${item.component}-${index}`}
                  onClick={() => setHighlightIndex(index)}
                  className={validHighlightIndex === index ? 'highlighted' : ''}
                >
                  <td>{index}</td>
                  <td>{item.component}</td>
                  <td>{item.floor}</td>
                  <td>{item.position.x.toFixed(2)}</td>
                  <td>{item.position.y.toFixed(2)}</td>
                  <td>{item.size.x.toFixed(2)}</td>
                  <td>{item.size.y.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="add-item-form">
          <label>
            <span>Component</span>
            <input
              type="text"
              value={newItemForm.component}
              onChange={(event) => updateNewItemForm('component', event.target.value)}
              placeholder="Item name"
            />
          </label>
          <label>
            <span>Floor</span>
            <input
              type="number"
              value={newItemForm.floor}
              onChange={(event) => updateNewItemForm('floor', event.target.value)}
            />
          </label>
          <label>
            <span>Position X</span>
            <input
              type="number"
              step="0.1"
              value={newItemForm.positionX}
              onChange={(event) => updateNewItemForm('positionX', event.target.value)}
            />
          </label>
          <label>
            <span>Position Y</span>
            <input
              type="number"
              step="0.1"
              value={newItemForm.positionY}
              onChange={(event) => updateNewItemForm('positionY', event.target.value)}
            />
          </label>
          <label>
            <span>Width</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={newItemForm.sizeX}
              onChange={(event) => updateNewItemForm('sizeX', event.target.value)}
            />
          </label>
          <label>
            <span>Height</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={newItemForm.sizeY}
              onChange={(event) => updateNewItemForm('sizeY', event.target.value)}
            />
          </label>
          <button type="button" onClick={handleAddItem}>
            Add
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
