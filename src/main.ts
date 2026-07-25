
// The calculation as a sequence:

// 1. Receive the inputs for one neutral-axis state.
// 2. Establish the strain distribution across the section.
// 3. Calculate the strain in each reinforcement layer.
// 4. Convert steel strain to stress, including the yield limit.
// 5. Calculate the concrete compression block.
// 6. Calculate the component forces and their locations.
// 7. Sum the forces and moments into the section result.
// 8. Assemble the capacity point.
// 9. Evaluate the balanced point as a separate final calculation.

type Datum = "compression" | "tension" | "neutral";

type PMOutputType = "nominal" | "factored";
// nice to have:
type PMState = "balanced" | "tension-controlled" | "compression-controlled";

interface ReinforcementLayers {
  tensileSteel: {
    "area": number;
    "depth": number;
  },
  compressionSteel: {
    "area": number;
    "depth": number;
  }
}

interface PMInputSet {
  assumptions: {
    "ultimateConcreteStrain": number;
    "betaFactor": number;
    "phi": {
      axial: number;
      flexure: number;
    },
    "datum": Datum;
  },
  neutralAxis: number,
  materialProperties: {
    concrete: {
      "fc": number;
      "Ec": number;
    },
    steel: {
      "fy": number;
      "Es": number;
    }
  },
  reinforcementLayers: ReinforcementLayers,
  effectiveDepth: number,
  sectionWidth: number,
  compressionSteelDepth?: number,
  output: PMOutputType
};

// # 1
function calculatePMInteraction(pmInputs: PMInputSet): any {
  const { assumptions, effectiveDepth, compressionSteelDepth, neutralAxis } = pmInputs;
  const { concrete, steel } = pmInputs.materialProperties;
  const { fc, Ec } = concrete;
  const { fy, Es } = steel;
  const { tensileSteel, compressionSteel } = pmInputs.reinforcementLayers;

  // # 2
  const concreteStrain: number = assumptions.ultimateConcreteStrain;
  const beta: number = assumptions.betaFactor;

  // # 3
  const tensileSteelStrain = () => concreteStrain * ((effectiveDepth / neutralAxis) - 1);


  const compressionSteelStrain = () => concreteStrain * (1 - ((compressionSteelDepth ?? 0) / neutralAxis));


  // # 4
  const tensileSteelStress = (Es: number, tensileSteelStrain: number) => Es * tensileSteelStrain;
  const cappedSteelStress = (steelStress: number, fy: number) => {
    if (steelStress > fy) {
      return fy;
    }
    return steelStress;
  }

  // # 5
  const concreteCompressionBlock = (beta: number, neutralAxis: number, sectionWidth: number, fc: number) => {
    return 0.85 * fc * beta * neutralAxis * sectionWidth;
  }

  // # 6
  const compressionSteelStress = (compressiveSteelStrain: number, Es: number) => Es * compressiveSteelStrain;
  // use the cappedSteelStress function to limit the stress to fy

  const calculateSteelCompression = (steelStress: number, compressionSteel: { area: number }) => {
    return steelStress * compressionSteel.area;
  }

  const calculateSteelTension = (steelStress: number, tensileSteel: { area: number }) => {
    return steelStress * tensileSteel.area;
  }

  // # 7
  const calculateP = () => {

  }

  const calculateM = () => {

  }

  // # 8
  const assembleCapacityPoint = () => {
    return {
      neutralAxis: neutralAxis,
      P: calculateP(),
      M: calculateM()
    }
  }

  return {
    capacityPoint: assembleCapacityPoint(),
    PMState: pmState
  };
}

const effectiveDepth = (sectionDepth: number, reinforcementLayers: ReinforcementLayers) => {

};

const compressionSteelDepth = (sectionDepth: number, reinforcementLayers: ReinforcementLayers) => {

};