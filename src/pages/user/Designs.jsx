import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import DesignCanvas from '../../components/DesignCanvas';
import ColorPicker from '../../components/ColorPicker';
import BackgroundControls from '../../components/BackgroundControls';

export default function Designs() {
  const [activeTab, setActiveTab] = useState('FILTER DESIGN');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [designNumbers, setDesignNumbers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [designDetails, setDesignDetails] = useState(null);
  const [viewMode, setViewMode] = useState('design');
  const [loading, setLoading] = useState({
    categories: false,
    subcategories: false,
    designs: false,
    details: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#f9fafb');
  const canvasRef = useRef(null);

  const handleBackgroundImage = (file) => {
    if (canvasRef.current) {
      canvasRef.current.handleBackgroundImage(file);
    }
  };

  const handleWebcamStart = () => {
    if (canvasRef.current) {
      canvasRef.current.startWebcam();
    }
  };

  const handleWebcamStop = () => {
    if (canvasRef.current) {
      canvasRef.current.stopWebcam();
    }
  };

  const getNextDesign = useCallback(() => {
    if (!designNumbers.length) return null;
    const nextIndex = (currentDesignIndex + 1) % designNumbers.length;
    return { index: nextIndex, design: designNumbers[nextIndex] };
  }, [designNumbers, currentDesignIndex]);

  const getPrevDesign = useCallback(() => {
    if (!designNumbers.length) return null;
    const prevIndex = currentDesignIndex === 0 ? designNumbers.length - 1 : currentDesignIndex - 1;
    return { index: prevIndex, design: designNumbers[prevIndex] };
  }, [designNumbers, currentDesignIndex]);

  useEffect(() => {
    let interval;
    if (isPlaying && designNumbers.length > 0) {
      interval = setInterval(() => {
        const next = getNextDesign();
        if (next) {
          if (next.index === 0) {
            setIsPlaying(false);
            toast((t) => (
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
                <span>You've reached the end of the designs</span>
              </div>
            ), { duration: 3000 });
          } else {
            setCurrentDesignIndex(next.index);
            handleDesignSelect(next.design);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, designNumbers, getNextDesign]);

  useEffect(() => {
    if (selectedDesign) {
      const index = designNumbers.findIndex(d => d.design_no === selectedDesign.design_no);
      if (index !== -1) {
        setCurrentDesignIndex(index);
      }
    }
  }, [selectedDesign, designNumbers]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.id);
    } else {
      setSubcategories([]);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubcategory) {
      fetchDesignNumbers(selectedCategory.id, selectedSubcategory.id);
    } else {
      setDesignNumbers([]);
      setSelectedDesign(null);
    }
  }, [selectedSubcategory]);

  useEffect(() => {
    if (selectedDesign) {
      fetchDesignDetails(selectedDesign.design_no);
    } else {
      setDesignDetails(null);
    }
  }, [selectedDesign]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (isPlaying) return;
    const next = getNextDesign();
    if (next) {
      setCurrentDesignIndex(next.index);
      handleDesignSelect(next.design);
    }
  };

  const handlePrevious = () => {
    if (isPlaying) return;
    const prev = getPrevDesign();
    if (prev) {
      setCurrentDesignIndex(prev.index);
      handleDesignSelect(prev.design);
    }
  };

  const fetchCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('id, code, name')
        .order('code');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Categories fetched:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const fetchSubcategories = async (categoryId) => {
    setLoading(prev => ({ ...prev, subcategories: true }));
    try {
      console.log('Fetching subcategories for category:', categoryId);
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;

      console.log('Subcategories fetched:', data);
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(prev => ({ ...prev, subcategories: false }));
    }
  };

  const fetchDesignNumbers = async (categoryId, subcategoryId) => {
    setLoading(prev => ({ ...prev, designs: true }));
    try {
      console.log('Fetching designs for category:', categoryId, 'subcategory:', subcategoryId);
      const { data, error } = await supabase
        .from('documents')
        .select('design_no, description')
        .eq('category_id', categoryId)
        .eq('subcategory_id', subcategoryId)
        .order('design_no');

      if (error) throw error;

      console.log('Designs fetched:', data);
      setDesignNumbers(data || []);
    } catch (error) {
      console.error('Error fetching design numbers:', error);
      toast.error('Failed to load design numbers');
    } finally {
      setLoading(prev => ({ ...prev, designs: false }));
    }
  };

  const fetchDesignDetails = async (designNo) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('design_no', designNo)
        .single();

      if (error) throw error;
      setDesignDetails(data);
    } catch (error) {
      console.error('Error fetching design details:', error);
      toast.error('Failed to load design details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const handleCategorySelect = (category) => {
    console.log('Selected category:', category);
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedDesign(null);
  };

  const handleSubcategorySelect = (subcategory) => {
    console.log('Selected subcategory:', subcategory);
    setSelectedSubcategory(subcategory);
    setSelectedDesign(null);
  };

  const handleDesignSelect = (design) => {
    console.log('Selected design:', design);
    setSelectedDesign(design);
  };

  const handleSearch = async (designNo) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          categories:category_id(*),
          subcategories:subcategory_id(*)
        `)
        .eq('design_no', designNo)
        .limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Design not found');
        return;
      }

      const designData = data[0];

      const category = {
        id: designData.category_id,
        code: designData.categories.code,
        name: designData.categories.name
      };
      setSelectedCategory(category);

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', category.id);

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);

      const subcategory = {
        id: designData.subcategory_id,
        name: designData.subcategories.name
      };
      setSelectedSubcategory(subcategory);

      const { data: designsData, error: designsError } = await supabase
        .from('documents')
        .select('design_no, description')
        .eq('category_id', category.id)
        .eq('subcategory_id', subcategory.id)
        .order('design_no');

      if (designsError) throw designsError;
      setDesignNumbers(designsData || []);

      const design = {
        design_no: designData.design_no,
        description: designData.description
      };
      setSelectedDesign(design);

      toast.success('Design found');
    } catch (error) {
      console.error('Error searching design:', error);
      toast.error('Error searching design');
    }
  };

  const renderDesignDetails = () => {
    if (!designDetails) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a design to view details
        </div>
      );
    }

    return (
      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Total Area</h4>
            <p className="text-sm text-gray-900">{designDetails.total_area.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Duration (min)</h4>
            <p className="text-sm text-gray-900">{designDetails.duration_min.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Total Stitches</h4>
            <p className="text-sm text-gray-900">{designDetails.total_switches}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Colours</h4>
            <p className="text-sm text-gray-900">{designDetails.colours}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Height (mm)</h4>
            <p className="text-sm text-gray-900">{designDetails.height.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Width (mm)</h4>
            <p className="text-sm text-gray-900">{designDetails.width.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Stabilizer Required</h4>
            <p className="text-sm text-gray-900">{designDetails.stabilizer_required}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Design Options</h4>
            <p className="text-sm text-gray-900">{designDetails.design_options}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Design Information</h4>
            <p className="text-sm text-gray-900">{designDetails.design_information}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Confidential</h4>
            <p className="text-sm text-gray-900">{designDetails.confidential}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Transfer</h4>
            <p className="text-sm text-gray-900">{designDetails.transfer}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('FILTER DESIGN')}
              className={`px-4 py-2 text-sm font-medium rounded whitespace-nowrap ${
                activeTab === 'FILTER DESIGN'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              FILTER DESIGN
            </button>
            <button
              onClick={() => setActiveTab('DESIGN DETAILS')}
              className={`px-4 py-2 text-sm font-medium rounded whitespace-nowrap ${
                activeTab === 'DESIGN DETAILS'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              DESIGN DETAILS
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin">
            {activeTab === 'FILTER DESIGN' ? (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">SELECT CATEGORY</h3>
                  <div className="h-[200px] overflow-y-auto border border-gray-200 rounded-md scrollbar-thin">
                    {loading.categories ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        No categories found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category)}
                            className={`w-full px-4 py-2 text-left text-sm ${
                              selectedCategory?.id === category.id
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">SELECT SUBCATEGORY</h3>
                  <div className="h-[200px] overflow-y-auto border border-gray-200 rounded-md scrollbar-thin">
                    {!selectedCategory ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        Select a category first
                      </div>
                    ) : loading.subcategories ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : subcategories.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        No subcategories found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategorySelect(subcategory)}
                            className={`w-full px-4 py-2 text-left text-sm ${
                              selectedSubcategory?.id === subcategory.id
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {subcategory.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">SELECT DESIGN NUMBER</h3>
                  <div className="h-[200px] overflow-y-auto border border-gray-200 rounded-md scrollbar-thin">
                    {!selectedSubcategory ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        Select a subcategory first
                      </div>
                    ) : loading.designs ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : designNumbers.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        No designs found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {designNumbers.map((design) => (
                          <button
                            key={design.design_no}
                            onClick={() => handleDesignSelect(design)}
                            className={`w-full px-4 py-2 text-left text-sm ${
                              selectedDesign?.design_no === design.design_no
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {design.design_no}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedDesign && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">DESIGN DESCRIPTION</h3>
                    <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                      {selectedDesign.description}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 h-full overflow-y-auto scrollbar-thin">
                {renderDesignDetails()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full rounded-lg overflow-hidden">
            {selectedDesign ? (
              <DesignCanvas 
                ref={canvasRef}
                designNo={selectedDesign.design_no} 
                viewMode={viewMode}
                backgroundColor={backgroundColor}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Select a design to preview</div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {selectedDesign ? `DESIGN NO: ${selectedDesign.design_no}` : 'No design selected'}
              </span>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!selectedDesign}
              >
                <option value="design">Design</option>
                <option value="worksheet">Worksheet</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick Search"
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const designNo = e.target.value.trim().toUpperCase();
                      handleSearch(designNo);
                    }
                  }}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrevious}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign || isPlaying}
                  title="Previous Design"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={handlePlayPause}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button 
                  onClick={handleNext}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign || isPlaying}
                  title="Next Design"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <BackgroundControls
                  onImageSelect={handleBackgroundImage}
                  onWebcamStart={handleWebcamStart}
                  onWebcamStop={handleWebcamStop}
                  backgroundType={canvasRef.current?.backgroundType}
                />
                <ColorPicker
                  onColorChange={(color) => {
                    setBackgroundColor(color);
                    if (canvasRef.current) {
                      canvasRef.current.setBackgroundColor(color);
                    }
                  }}
                  initialColor={backgroundColor}
                />
                <button 
                  onClick={() => canvasRef.current?.downloadCanvas()}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => canvasRef.current?.zoomIn()}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => canvasRef.current?.zoomOut()}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 bg-white rounded-md border border-gray-200"
                  disabled={!selectedDesign}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}